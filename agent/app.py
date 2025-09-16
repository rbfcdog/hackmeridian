from fastapi import FastAPI
from pydantic import BaseModel
from agent import StellarConverseCrew

app = FastAPI()
crew = StellarConverseCrew()

class QueryRequest(BaseModel):
    query: str
    session_id: str

@app.post("/query")
def query_endpoint(request: QueryRequest):
    result = crew.process_query(request.query, request.session_id)
    return {"result": result}

@app.get("/session/{session_id}")
def get_session_info(session_id: str):
    from agent import SESSION_STORAGE
    session_data = SESSION_STORAGE.get(session_id, {})
    return {
        "session_id": session_id,
        "authenticated": bool(session_data.get("sessionToken")),
        "user_id": session_data.get("userId"),
        "email": session_data.get("email")
    }