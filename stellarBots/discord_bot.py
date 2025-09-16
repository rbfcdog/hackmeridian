# discord_bot.py
import os
import logging
import discord
import httpx

def setup_discord_bot():
    """Prepara e retorna o cliente do bot do Discord, mas não o executa."""
    
    DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
    API_ENDPOINT = os.getenv("API_ENDPOINT")

    if not DISCORD_TOKEN:
        raise ValueError("Token do Discord não encontrado!")

    intents = discord.Intents.default()
    intents.message_content = True
    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        logging.info(f'Bot do Discord conectado como {client.user}')
        await client.change_presence(activity=discord.Activity(type=discord.ActivityType.listening, name="perguntas sobre Stellar"))

    # discord_bot.py -> função on_message

    @client.event
    async def on_message(message):
        if message.author == client.user or message.author.bot:
            return
        if not isinstance(message.channel, discord.TextChannel):
            return

        # O author.id do Discord será nosso session_id
        session_id = str(message.author.id)

        data_to_send = {
            "query": message.content,
            "session_id": session_id
        }
        
        logging.info(f"[Discord] Enviando para a API do Agente: {data_to_send}")

        try:
            async with httpx.AsyncClient() as http_client:
                response = await http_client.post(API_ENDPOINT, json=data_to_send, timeout=60.0)
                response.raise_for_status()
                
                # A resposta da API agora vem dentro de uma chave "result"
                api_response_data = response.json().get('result', {})
                
                # Assumimos que o crew sempre retorna uma chave "message" para o usuário
                content = api_response_data.get("message", "Não obtive uma resposta válida do assistente.")
                
                if not content:
                    await message.channel.send("Desculpe, não recebi um conteúdo válido para exibir.")
                    return

                await message.channel.send(content)
                
        except Exception as exc:
            logging.error(f"[Discord] Erro ao comunicar com a API do Agente: {exc}")
            await message.channel.send("Desculpe, estou com um problema técnico para contatar o assistente.")
            
    return client