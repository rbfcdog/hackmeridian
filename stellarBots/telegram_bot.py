# telegram_bot.py
import os
import logging
import httpx
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

def setup_telegram_bot():
    """Prepara e retorna a aplicação do bot do Telegram, mas não a executa."""

    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
    API_ENDPOINT = os.getenv("API_ENDPOINT")

    if not TELEGRAM_TOKEN:
        raise ValueError("Token do Telegram não encontrado!")

    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        user = update.effective_user
        await update.message.reply_html(
            f"Olá, {user.first_name}! 👋\n\nEu sou o <b>TalkToStellar</b>, seu assistente de IA."
        )

    # telegram_bot.py -> função process_message

    async def process_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        # O user_id do Telegram é perfeito para ser o nosso session_id
        session_id = str(update.effective_user.id)
        
        # O formato do payload agora precisa ser o que o nosso FastAPI espera
        data_to_send = {
            "query": update.message.text,
            "session_id": session_id
        }

        logging.info(f"[Telegram] Enviando para a API do Agente: {data_to_send}")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(API_ENDPOINT, json=data_to_send, timeout=60.0) # Aumentei o timeout
                response.raise_for_status()
                
                # A resposta da API agora vem dentro de uma chave "result"
                api_response_data = response.json().get('result', {})
                
                # Assumimos que o crew sempre retorna uma chave "message" para o usuário
                content = api_response_data.get("message", "Não obtive uma resposta válida do assistente.")

                if not content:
                    await update.message.reply_text("Desculpe, não recebi um conteúdo válido.")
                    return

                # Por enquanto, enviamos a resposta como texto simples.
                await update.message.reply_text(content)

        except Exception as exc:
            logging.error(f"[Telegram] Erro ao comunicar com a API do Agente: {exc}")
            await update.message.reply_text("Desculpe, estou com um problema técnico para contatar o assistente.")

    application = Application.builder().token(TELEGRAM_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), process_message))
    
    return application