from crewai import Agent, Task, Crew, Process
from crewai_tools import JSONSearchTool
from langchain_openai import OpenAI
import os
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Literal
from dotenv import load_dotenv
import json

# --- Pydantic Models for Data Structure ---
class UserInfo(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    kyc_completed: bool = False
    transaction_history: List[Dict[str, Any]] = []
    account_status: Optional[str] = "inactive"


class TaskResponse(BaseModel):
    message: str
    task: Literal[
        "add_contact",
        "list_contacts",
        "lookup_contact",
        "get_account_balance",
        "get_operations_history",
        "execute_payment",
        "clarification_needed",
        "execute_path_payment",
        "initiate_pix_deposit",
        "onboard_user"
    ]
    params: Dict[str, Any]


# --- Main Crew Class ---
class StellarConverseCrew:
    """
    Stellar Converse Crew with a more comprehensive single agent.
    The agent now uses context and examples to better decide which task to execute.
    """

    def __init__(self):
        load_dotenv()
        self.llm = OpenAI(
            temperature=0.35,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            max_tokens=2000
        )

        # Load user session data for context
        # Renamed the file to user_data.json for clarity
        # with open('user_data.json', 'r') as f:
        #     self.user_session = json.dumps(json.load(f), indent=2)

        # print("--- User Session Loaded ---")
        # print(self.user_session)
        # print("---------------------------")


    def main_agent(self) -> Agent:
        """Single agent that decides which task to execute"""
        return Agent(
            role="Stellar Assistant",
            goal="Understand the user's query and current context, then generate a precise JSON object to trigger the correct backend task.",
            backstory="""
            You are an expert AI assistant named Stellar Assistant. Your sole purpose is to translate a user's request into a structured JSON object that a backend system can process. You operate as a WhatsApp bot helping users with their Stellar account.

            **Core Capabilities:**
            - Fetch user information (profile, balance, transaction history, account status).
            - Initiate actions, specifically sending payments.

            **Critical Rule: Your output MUST be a single, valid JSON object and nothing else.**
            - Do not add explanations or any text before or after the JSON.
            - The JSON must strictly adhere to the `TaskResponse` schema.

            **Available Tasks & Parameters:**
            1.  "add_contact": 'params: { "name": "", "stellar_public_key": "" }'
            2.  "list_contacts": 'params: {}'
            3.  "lookup_contact": 'params: { "name": "" }'
            4.  "get_account_balance": 'params: {}'
            5.  "get_operations_history": 'params: {}'
            6.  "execute_payment": 'params: { "receiver_key": "", "amount": "", "asset_code": "", "receiver_name": "", "type": "payment", "status": "pending" }'
            7.  "clarification_needed": 'params: { "message": "" }'
            8.  "execute_path_payment": 'params: { "path": [], "amount": "", "asset_code": "" }'
            9.  "initiate_pix_deposit": 'params: { "amount": "", "asset_code": "" }'
            10. "onboard_user": 'params: { "name": "", "email": "" }'

            `### OUTPUT FORMAT ---
You must only respond with a JSON object with the following structure:
{
  "message": "A user-facing message in Portuguese explaining the action being taken or asking for more information.",
  "task": "The specific, machine-readable task identifier.",
  "params": {
    "key": "value"
    // All extracted parameters for the task go here.
  }
}

---
### EXAMPLES ---

# --- Onboarding e Gerenciamento de Usuário ---

* User Query: "quero criar uma conta nova"
* Your Output:
  ```json
  {
    "message": "Entendido. Para criar uma conta, por favor, me informe seu e-mail no comando. Exemplo: 'criar conta com o email meuemail@exemplo.com'",
    "task": "clarification_needed",
    "params": {}
  }`

- User Query: "criar conta com o email dev@hackathon.com"
- Your Output:
    
    `{
      "message": "Perfeito. Vou criar sua conta Stellar agora...",
      "task": "onboard_user",
      "params": {
        "email": "dev@hackathon.com"
      }
    }`
            # Gerenciamento de Contatos ---

- User Query: "adicionar a Maria na minha lista de contatos, a chave dela é GABCD...XYZ"
- Your Output:
    
    `{
      "message": "Adicionando Maria (GABCD...XYZ) aos seus contatos.",
      "task": "add_contact",
      "params": {
        "contactName": "Maria",
        "publicKey": "GABCD...XYZ"
      }
    }`
    
- User Query: "quem eu tenho salvo nos meus contatos?"
- Your Output:
    
    `{
      "message": "Buscando sua lista de contatos...",
      "task": "list_contacts",
      "params": {}
    }`
    
- User Query: "qual a chave do joão"
- Your Output:
    s
    `{
      "message": "Verificando a chave pública de João...",
      "task": "lookup_contact",
      "params": {
          "contactName": "João"
      }
    }`
    

# -- Consultas ---

- User Query: "qual meu saldo?" or "ver minha carteira"
- Your Output:JSON
    
    `{
      "message": "Consultando os saldos da sua carteira...",
      "task": "get_account_balance",
      "params": {}
    }`
    
- User Query: "mostra minhas últimas operações"
- Your Output:JSON
    
    `{
      "message": "Buscando seu histórico de operações...",
      "task": "get_operations_history",
      "params": {}
    }`
    

# -- Pagamentos Simples (Casos Variados) ---

- User Query: "enviar 150 BRLC para GDEY...ABCD"
- Your Output:
    
    `{
      "message": "Preparando o envio de 150 BRLC...",
      "task": "execute_payment",
      "params": {
        "destination": "GDEY...ABCD",
        "amount": "150",
        "assetCode": "BRLC"
      }
    }`
    
- User Query: "pague 25.5 XLM para o contato João com o memo 'hackathon'"
- Your Output (after using the tool to find João's key internally):
    
    `{
      "message": "Preparando o envio de 25.5 XLM para João (GA...XYZ).",
      "task": "execute_payment",
      "params": {
        "destination": "GA...XYZ",
        "amount": "25.5",
        "assetCode": "XLM",
        "memo": "hackathon"
      }
    }`
    
- User Query: "enviar 50 para a Maria" (Asset ambiguity)
- Your Output:
    
    `{
      "message": "Não consegui identificar qual ativo você quer enviar. Por favor, tente novamente de forma mais específica, por exemplo: 'enviar 50 XLM para a Maria'.",
      "task": "clarification_needed",
      "params": {}
    }`
    

# -- Path Payments (A Funcionalidade Chave) ---

- User Query: "quero que a Maria receba exatamente 200 USDC. me diga quanto custa em BRLC e pode enviar"
- Your Output (after using the tool to find Maria's key internally):
    
    `{
      "message": "Calculando o custo para que Maria (GB...ABC) receba 200 USDC e preparando a transação...",
      "task": "execute_path_payment",
      "params": {
        "destination": "GB...ABC",
        "destAsset": "USDC",
        "destAmount": "200",
        "sourceAsset": "BRLC"
      }
    }`
    
- User Query: "enviar 1000 reais para o meu fornecedor na Europa e quero que ele receba em euro"
- Your Output:
    
    `{
      "message": "Para fazer um envio internacional complexo, preciso que o comando inclua o contato ou a chave pública do destinatário e o código exato do ativo de destino. Exemplo: 'enviar 1000 BRLC para o contato Fornecedor Europa para que ele receba em EURT'",
      "task": "clarification_needed",
      "params": {}
    }`
    

# -- On-Ramp (PIX) ---

- User Query: "quero depositar 500 reais na minha conta com pix"
- Your Output:
    
    `{
      "message": "Iniciando um depósito de R$ 500.00 via PIX...",
      "task": "initiate_pix_deposit",
      "params": {
        "assetCode": "BRLC",
        "amount": "500.00"
      }
    }`
                
            """,
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=3
        )

    def process_query(self, query: str):
        """
        Main entry point - the agent uses the query and user session
        context to decide which backend task to run.
        """
        agent = self.main_agent()

        # **IMPROVEMENT**: The user query and session data are now formatted
        # directly into the task description, giving the agent full context.
        task_description = f"""
            You are deciding which backend task should be called.
            Analyze the user's query and the provided user session context to determine the correct backend task and its parameters.

            **User's Query:** "{query}"

            **Your Goal:**
            Generate a single, valid JSON object that matches the `TaskResponse` Pydantic model.

            **Instructions & Logic:**
            1. Read the user's query to understand their intent.
            2. If the task is "payment":
               a. Extract the `amount` and `asset_code` (e.g., XLM, USDC). If no asset is specified, assume XLM.
               b. Identify the recipient. If it's a name (e.g., "Bob"), use the `JSONSearchTool` on `contacts.json` to find their public key. If it's a public key (starts with 'G'), use it directly.
               c. Construct the `params` dictionary with all required fields.
            3. For all other tasks (`get_...`), the `params` dictionary must be empty (`{{}}`).
            4. If you cannot fulfill the request (e.g., contact not found), follow the error handling rule in your backstory.
            5. Formulate a user-friendly `message` that confirms the action or explains the problem.

            **Strict Rules:**
            - Do not return extra text, only the raw JSON object.
            - Ensure the JSON is always valid and follows the schema.
            - Never hallucinate a public key.
            """

        decision_task = Task(
            description=task_description,
            agent=agent,
            expected_output="A single valid JSON object that conforms to the model.",
            output_file="decision_output.json",
            tools=[JSONSearchTool(json_path="contacts.json")]
        )

        crew = Crew(
            agents=[agent],
            tasks=[decision_task],
            process=Process.sequential,
            verbose=True # Set to 2 for detailed agent/tool logging
        )

        result = crew.kickoff()
        return result


if __name__ == "__main__":
    crew = StellarConverseCrew()
    
    print("\nStellar Assistant is ready. Type 'exit' to quit.")
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        response = crew.process_query(user_input)
        print("Bot:", response)