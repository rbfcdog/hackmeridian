from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from crewai_tools import JSONSearchTool
from langchain_openai import OpenAI
import os
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Literal
from dotenv import load_dotenv
import json
import requests

# Gerenciador de sessão em memória
# A chave é o ID do usuário da plataforma de chat (ex: 'whatsapp:+5521999999999')
SESSION_STORAGE = {}

# Configurações da API
NODE_API_BASE_URL = os.getenv("NODE_API_BASE_URL", "http://localhost:3001")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your-shared-secret")

# --- Tools ---
class LoginTool(BaseTool):
    name: str = "Login Tool"
    description: str = "Authenticates a user by their email and returns a session token."

    def _run(self, email: str) -> dict:
        try:
            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/login",
                headers={"x-internal-secret": INTERNAL_API_SECRET},
                json={"email": email}
            )
            response.raise_for_status()  # Lança um erro para status 4xx/5xx
            return response.json()
        except requests.exceptions.HTTPError as e:
            return {"success": False, "message": f"Login failed: {e.response.json().get('message')}"}
        except Exception as e:
            return {"success": False, "message": f"An unexpected error occurred during login: {str(e)}"}

class AddContactTool(BaseTool):
    name: str = "Add Contact Tool"
    description: str = "Adds a new contact to the user's address book."

    def _run(self, session_token: str, contactName: str, publicKey: str) -> dict:
        try:
            headers = {
                "Authorization": f"Bearer {session_token}",
                "x-internal-secret": INTERNAL_API_SECRET
            }
            payload = {
                "contactName": contactName,
                "publicKey": publicKey
            }
            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/add-contact",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "message": "Failed to add contact."}

class ListContactsTool(BaseTool):
    name: str = "List Contacts Tool"
    description: str = "Lists all contacts for the authenticated user."

    def _run(self, session_token: str) -> dict:
        try:
            headers = {
                "Authorization": f"Bearer {session_token}",
                "x-internal-secret": INTERNAL_API_SECRET
            }
            response = requests.get(
                f"{NODE_API_BASE_URL}/api/actions/list-contacts",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "message": "Failed to list contacts."}

class GetAccountBalanceTool(BaseTool):
    name: str = "Get Account Balance Tool"
    description: str = "Gets the account balance for the authenticated user."

    def _run(self, session_token: str) -> dict:
        try:
            headers = {
                "Authorization": f"Bearer {session_token}",
                "x-internal-secret": INTERNAL_API_SECRET
            }
            response = requests.get(
                f"{NODE_API_BASE_URL}/api/actions/get-account-balance",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "message": "Failed to get account balance."}

class ExecutePaymentTool(BaseTool):
    name: str = "Execute Payment Tool"
    description: str = "Executes a payment transaction."

    def _run(self, session_token: str, destination: str, amount: str, assetCode: str, memo: str = "") -> dict:
        try:
            headers = {
                "Authorization": f"Bearer {session_token}",
                "x-internal-secret": INTERNAL_API_SECRET
            }
            payload = {
                "destination": destination,
                "amount": amount,
                "assetCode": assetCode,
                "memo": memo
            }
            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/sign-and-submit-xdr",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "message": "Failed to execute payment."}

# Initialize tools
login_tool = LoginTool()
add_contact_tool = AddContactTool()
list_contacts_tool = ListContactsTool()
get_account_balance_tool = GetAccountBalanceTool()
execute_payment_tool = ExecutePaymentTool()

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
        "onboard_user",
        "login"
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
            1.  "add_contact": 'params: { "contactName": "", "publicKey": "" }'
            2.  "list_contacts": 'params: {}'
            3.  "lookup_contact": 'params: { "contactName": "" }'
            4.  "get_account_balance": 'params: {}'
            5.  "get_operations_history": 'params: {}'
            6.  "execute_payment": 'params: { "destination": "", "amount": "", "assetCode": "", "memo": "" }'
            7.  "clarification_needed": 'params: { "message": "" }'
            8.  "execute_path_payment": 'params: { "destination": "", "destAsset": "", "destAmount": "", "sourceAsset": "" }'
            9.  "initiate_pix_deposit": 'params: { "amount": "", "assetCode": "" }'
            10. "onboard_user": 'params: { "name": "", "email": "" }'
            11. "login": 'params: { "email": "" }'

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

# --- Autenticação ---

- User Query: "fazer login com dev@hackathon.com"
- Your Output:
    
    `{
      "message": "Fazendo login com dev@hackathon.com...",
      "task": "login",
      "params": {
        "email": "dev@hackathon.com"
      }
    }`

- User Query: "login usando email@exemplo.com"
- Your Output:
    
    `{
      "message": "Autenticando com email@exemplo.com...",
      "task": "login",
      "params": {
        "email": "email@exemplo.com"
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

    def process_query(self, query: str, session_id: str = "default_session"):
        """
        Main entry point - the agent uses the query and session ID
        to decide which backend task to run with authentication.
        """
        agent = self.main_agent()
        
        # Verificar se o usuário está autenticado (exceto para tarefas públicas)
        public_tasks = ["login", "onboard_user"]
        
        # Primeiro, vamos determinar qual tarefa o usuário quer executar
        # usando um agente temporário para análise
        analysis_task_description = f"""
            Analyze the user's query to determine which task they want to execute.
            
            **User's Query:** "{query}"
            
            Determine the task type from this query and return ONLY the task name (one word):
            - login
            - onboard_user
            - add_contact
            - list_contacts
            - lookup_contact
            - get_account_balance
            - get_operations_history
            - execute_payment
            - execute_path_payment
            - initiate_pix_deposit
            - clarification_needed
            
            Return only the task name, nothing else.
            """
        
        analysis_task = Task(
            description=analysis_task_description,
            agent=agent,
            expected_output="Single task name"
        )
        
        analysis_crew = Crew(
            agents=[agent],
            tasks=[analysis_task],
            process=Process.sequential,
            verbose=False
        )
        
        task_type = str(analysis_crew.kickoff()).strip()
        
        # Verificar autenticação para tarefas protegidas
        if task_type not in public_tasks:
            session_data = SESSION_STORAGE.get(session_id)
            if not session_data or not session_data.get("sessionToken"):
                return {
                    "message": "Você precisa fazer login primeiro. Por favor, envie seu email para autenticar. Exemplo: 'fazer login com email@exemplo.com'",
                    "task": "clarification_needed",
                    "params": {"requires_login": True}
                }
        
        # Se for uma tarefa de login, executar diretamente
        if task_type == "login":
            return self._handle_login(query, session_id)
        
        # Para outras tarefas, continuar com o fluxo normal
        session_token = SESSION_STORAGE.get(session_id, {}).get("sessionToken", "")
        
        task_description = f"""
            You are deciding which backend task should be called.
            Analyze the user's query to determine the correct backend task and its parameters.

            **User's Query:** "{query}"
            **Session ID:** "{session_id}"
            **Authentication Token Available:** {"Yes" if session_token else "No"}

            **Your Goal:**
            Generate a single, valid JSON object that matches the `TaskResponse` Pydantic model.

            **Available Tasks & Parameters:**
            1.  "add_contact": 'params: {{ "contactName": "", "publicKey": "" }}'
            2.  "list_contacts": 'params: {{}}'
            3.  "lookup_contact": 'params: {{ "contactName": "" }}'
            4.  "get_account_balance": 'params: {{}}'
            5.  "get_operations_history": 'params: {{}}'
            6.  "execute_payment": 'params: {{ "destination": "", "amount": "", "assetCode": "", "memo": "" }}'
            7.  "clarification_needed": 'params: {{ "message": "" }}'
            8.  "execute_path_payment": 'params: {{ "destination": "", "destAsset": "", "destAmount": "", "sourceAsset": "" }}'
            9.  "initiate_pix_deposit": 'params: {{ "amount": "", "assetCode": "" }}'
            10. "onboard_user": 'params: {{ "name": "", "email": "" }}'
            11. "login": 'params: {{ "email": "" }}'

            **Instructions & Logic:**
            1. Read the user's query to understand their intent.
            2. If the task is "payment":
               a. Extract the `amount` and `asset_code` (e.g., XLM, USDC). If no asset is specified, assume XLM.
               b. Identify the recipient. If it's a name (e.g., "Bob"), use the `JSONSearchTool` on `contacts.json` to find their public key. If it's a public key (starts with 'G'), use it directly.
               c. Construct the `params` dictionary with all required fields.
            3. For all other tasks, construct appropriate parameters.
            4. If you cannot fulfill the request (e.g., contact not found), follow the error handling rule.
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
            verbose=True
        )

        result = crew.kickoff()
        
        # Se o resultado for uma tarefa que requer execução de ferramenta, executar aqui
        try:
            import json
            if isinstance(result, str):
                task_data = json.loads(result)
            else:
                task_data = result
                
            if isinstance(task_data, dict):
                task_type = task_data.get("task")
                session_token = SESSION_STORAGE.get(session_id, {}).get("sessionToken")
                
                # Executar ferramentas protegidas se houver token
                if session_token and task_type in ["add_contact", "list_contacts", "get_account_balance", "execute_payment"]:
                    tool_result = self._execute_protected_task(task_type, task_data.get("params", {}), session_token)
                    if tool_result:
                        task_data["tool_result"] = tool_result
                        
            return task_data
        except:
            # Se não conseguir parsear, retornar o resultado original
            return result
    
    def _execute_protected_task(self, task_type: str, params: dict, session_token: str):
        """Execute protected tasks using the appropriate tools"""
        try:
            if task_type == "add_contact":
                return add_contact_tool._run(
                    session_token=session_token,
                    contactName=params.get("contactName", ""),
                    publicKey=params.get("publicKey", "")
                )
            elif task_type == "list_contacts":
                return list_contacts_tool._run(session_token=session_token)
            elif task_type == "get_account_balance":
                return get_account_balance_tool._run(session_token=session_token)
            elif task_type == "execute_payment":
                return execute_payment_tool._run(
                    session_token=session_token,
                    destination=params.get("destination", ""),
                    amount=params.get("amount", ""),
                    assetCode=params.get("assetCode", "XLM"),
                    memo=params.get("memo", "")
                )
        except Exception as e:
            return {"success": False, "message": f"Tool execution failed: {str(e)}"}
        return None
    
    def _handle_login(self, query: str, session_id: str):
        """Handle login task specifically"""
        # Extrair email da query
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, query)
        
        if not emails:
            return {
                "message": "Por favor, forneça um email válido para fazer login. Exemplo: 'fazer login com email@exemplo.com'",
                "task": "clarification_needed",
                "params": {}
            }
        
        email = emails[0]
        
        # Executar login
        login_result = login_tool._run(email)
        
        if login_result.get("success"):
            # Salvar token na sessão
            SESSION_STORAGE[session_id] = {
                "sessionToken": login_result.get("sessionToken"),
                "userId": login_result.get("userId"),
                "email": email
            }
            return {
                "message": f"Login realizado com sucesso! Bem-vindo, {email}",
                "task": "login",
                "params": {"email": email, "success": True}
            }
        else:
            return {
                "message": f"Falha no login: {login_result.get('message')}",
                "task": "login",
                "params": {"email": email, "success": False}
            }


if __name__ == "__main__":
    crew = StellarConverseCrew()
    
    print("\nStellar Assistant is ready. Type 'exit' to quit.")
    print("Note: This is a demo session. In production, session_id would come from WhatsApp user ID.")
    
    demo_session_id = "demo_user_session"
    
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        response = crew.process_query(user_input, demo_session_id)
        print("Bot:", response)