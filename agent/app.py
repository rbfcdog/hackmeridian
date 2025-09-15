from fastapi import FastAPI
from agent import handle_query

app = FastAPI()

@app.post("/query")
def query_endpoint(user_query: str):
    result = handle_query(user_query)
    return {"result": result}