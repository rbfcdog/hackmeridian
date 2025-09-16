# agent_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging

# Importe a classe do seu agente. Supondo que o arquivo se chame 'agent.py'
# e a classe seja 'StellarConverseCrew'. Adapte se o nome for diferente.
from agent import StellarConverseCrew, SESSION_STORAGE

# Configura o logging
logging.basicConfig(level=logging.INFO)

# Inicializa a aplicação FastAPI e o Crew
app = FastAPI(
    title="Stellar Converse AI Agent API",
    description="An API to process user queries via a CrewAI agent."
)
crew = StellarConverseCrew()

class QueryRequest(BaseModel):
    query: str
    session_id: str # O user_id do Telegram/Discord será usado aqui

# --- Endpoints da API ---

@app.post("/query")
def handle_query(request: QueryRequest):
    """
    Este é o endpoint principal que recebe as mensagens dos bots.
    """
    try:
        logging.info(f"Recebida query para session_id='{request.session_id}': '{request.query}'")
        
        # Chama o método do seu crew para processar a mensagem
        result = crew.process_query(request.query, request.session_id)
        
        logging.info(f"Resposta do CrewAI: {result}")
        return {"result": result}
    except Exception as e:
        logging.error(f"Erro ao processar a query para session_id='{request.session_id}': {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/session/{session_id}")
def get_session_info(session_id: str):
    """Endpoint de utilidade para verificar o estado da sessão (se está logado, etc.)"""
    session_data = SESSION_STORAGE.get(session_id, {})
    return {
        "session_id": session_id,
        "authenticated": bool(session_data.get("sessionToken")),
        "user_id": session_data.get("userId"),
        "email": session_data.get("email")
    }

# Para rodar este servidor, use o comando: uvicorn agent_server:app --reload --port 8000