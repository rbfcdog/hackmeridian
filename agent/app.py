
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simple import SimpleAgent


app = FastAPI()

# Allow CORS for all origins (for development; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crew = SimpleAgent()

class QueryRequest(BaseModel):
    query: str
    session_id: str

@app.post("/query")
def query_endpoint(request):
    result = crew.process_query(request["query"], request["session_id"]) # integracao com front
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