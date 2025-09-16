# main.py
import os
import asyncio
import logging

# Importa as funções de setup que acabamos de criar
from discord_bot import setup_discord_bot
from telegram_bot import setup_telegram_bot

# Configuração básica de logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)

async def main():
    """
    Função principal que inicializa e executa os dois bots concorrentemente.
    """
    logging.info("Iniciando o orquestrador de bots...")

    # Pega os tokens do ambiente
    DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

    if not DISCORD_TOKEN or not TELEGRAM_TOKEN:
        raise ValueError("DISCORD_TOKEN e TELEGRAM_TOKEN devem ser definidos como variáveis de ambiente.")

    # Prepara os bots
    discord_client = setup_discord_bot()
    telegram_application = setup_telegram_bot()

    # Gerenciador de contexto para garantir que o bot do Telegram seja finalizado corretamente
    async with telegram_application:
        # Inicializa a aplicação do Telegram
        await telegram_application.initialize()
        
        # --- LINHA ADICIONADA ---
        # Começa a buscar por atualizações (polling) em segundo plano
        await telegram_application.updater.start_polling()
        
        # Ativa os handlers (process_message, start, etc.)
        await telegram_application.start()
        
        logging.info("Bot do Telegram iniciado e fazendo polling...")
        
        # Inicia o cliente do Discord. Ele vai manter o loop de eventos vivo para os dois bots.
        await discord_client.start(DISCORD_TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Desligando os bots...")