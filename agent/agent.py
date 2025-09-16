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
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "hackathon-secret-2024")

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
                "Content-Type": "application/json",
                "Authorization": f"Bearer {session_token}",
                "x-internal-secret": INTERNAL_API_SECRET
            }
            print(headers)
            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/list-contacts",
                headers=headers
            )
            print(response)
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
        """Single agent that decides which task to execute using Pydantic output"""
        master_prompt = """
# ROLE AND GOAL
You are 'Converse', a highly specialized AI financial assistant for Stellar blockchain operations. You are an expert at understanding user intent and translating natural language requests into precise, structured commands for financial operations.

# CORE MISSION
Your primary function is to analyze user queries and generate TaskResponse objects that precisely capture the user's intent with all necessary parameters for execution.

# AVAILABLE OPERATIONS
You can process these types of requests:

## Authentication & User Management
- "login": User authentication via email
- "onboard_user": Account creation with user details

## Contact Management  
- "add_contact": Add new contact with name and Stellar public key
- "list_contacts": Retrieve all saved contacts
- "lookup_contact": Find specific contact by name

## Account Operations
- "get_account_balance": Check account balance and asset holdings
- "get_operations_history": Retrieve transaction history

## Payment Operations
- "execute_payment": Direct payment to destination
- "execute_path_payment": Cross-asset payment with conversion
- "initiate_pix_deposit": PIX deposit to acquire BRLC

## Helper Operations
- "clarification_needed": Request more information when intent is unclear

# TASK PROCESSING METHODOLOGY

## Step 1: Intent Analysis
- Identify the core operation the user wants to perform
- Extract all mentioned parameters (amounts, recipients, assets, etc.)
- Determine if the request is complete or needs clarification

## Step 2: Parameter Extraction
- **Recipients**: Extract public keys (starting with 'G') or contact names
- **Amounts**: Parse numeric values with proper decimals
- **Assets**: Identify asset codes (XLM, USDC, BRLC, etc.)
- **Additional Data**: Memos, emails, names, etc.

## Step 3: Validation & Response
- Ensure all required parameters are present
- Generate appropriate user-friendly message in Portuguese
- Structure response according to TaskResponse schema

# RESPONSE EXAMPLES

## Authentication
User: "fazer login com usuario@email.com"
→ task: "login", params: {"email": "usuario@email.com"}

## Contact Operations
User: "adicionar João com chave GXXXXX..."
→ task: "add_contact", params: {"contactName": "João", "publicKey": "GXXXXX..."}

User: "quem eu tenho nos contatos?"
→ task: "list_contacts", params: {}

## Financial Operations
User: "qual meu saldo?"
→ task: "get_account_balance", params: {}

User: "enviar 100 XLM para Maria"
→ task: "execute_payment", params: {"destination": "[Maria's key from contacts]", "amount": "100", "assetCode": "XLM"}

User: "depositar 500 reais via PIX"
→ task: "initiate_pix_deposit", params: {"amount": "500", "assetCode": "BRLC"}

# CRITICAL RULES
1. Always respond with complete TaskResponse structure
2. Use Portuguese for user-facing messages
3. Extract exact parameters - never hallucinate data
4. Request clarification when information is insufficient
5. Validate all extracted data before responding

        """
        
        return Agent(
            role="Stellar Assistant",
            goal="Analisar a query do usuário e traduzi-la em um comando TaskResponse estruturado.",
            backstory=master_prompt,
            tools=[JSONSearchTool(json_path="contacts.json")],
            llm=self.llm,
            verbose=True,
            max_iter=3
        )

    def process_query(self, query: str, session_id: str = "default_session") -> TaskResponse:
        """
        Main entry point - processes user query and returns structured TaskResponse
        """
        agent = self.main_agent()
        
        # Verificar se o usuário está autenticado (exceto para tarefas públicas)
        public_tasks = ["login", "onboard_user", "clarification_needed"]
        
        # Se for uma query de login, tratar diretamente
        if "login" in query.lower() and "@" in query:
            return self._handle_login(query, session_id)
        
        # Verificar autenticação para tarefas protegidas
        session_data = SESSION_STORAGE.get(session_id)
        session_token = session_data.get("sessionToken") if session_data else None
        
        # Preparar contexto de autenticação
        auth_context = ""
        if session_token:
            auth_context = f"User is authenticated with session token. Session ID: {session_id}"
        else:
            auth_context = "User is NOT authenticated. Only public operations (login, onboard_user) are allowed."
        
        # Criar tarefa principal com output Pydantic
        main_task = Task(
            description=f"""
            Processe a query do usuário: '{query}'
            
            Contexto de autenticação: {auth_context}
            
            Analise a query seguindo sua metodologia interna e formate a decisão final como um objeto TaskResponse válido.
            
            Se o usuário não estiver autenticado e tentar executar uma operação protegida, 
            retorne uma tarefa 'clarification_needed' solicitando login.
            """,
            expected_output="Um objeto TaskResponse estruturado e validado",
            agent=agent,
            output_pydantic=TaskResponse  # MUDANÇA PRINCIPAL: Output direto para Pydantic
        )
        
        # Executar crew com a nova estrutura
        crew = Crew(
            agents=[agent],
            tasks=[main_task],
            process=Process.sequential,
            verbose=True
        )
        
        # O resultado agora é um objeto TaskResponse, não uma string!
        inputs = {"query": query}
        structured_result: TaskResponse = crew.kickoff(inputs=inputs)
        
        # Verificar se é uma operação protegida sem autenticação
        if (structured_result.task not in public_tasks and not session_token):
            return TaskResponse(
                message="Você precisa fazer login primeiro. Por favor, envie seu email para autenticar. Exemplo: 'fazer login com email@exemplo.com'",
                task="clarification_needed",
                params={"requires_login": True}
            )
        
        # Executar ferramenta real se necessário
        if session_token and structured_result.task in ["add_contact", "list_contacts", "get_account_balance", "execute_payment"]:
            tool_result = self._execute_protected_task(
                structured_result.task, 
                structured_result.params, 
                session_token
            )
            if tool_result:
                # Adicionar resultado da ferramenta como parâmetro extra
                structured_result.params["tool_result"] = tool_result
        
        return structured_result
    
    def _execute_protected_task(self, task_type: str, params: dict, session_token: str):
        print("chegou protected task")
        """Execute protected tasks using the appropriate tools"""
        try:
            if task_type == "add_contact":
                return add_contact_tool._run(
                    session_token=session_token,
                    contactName=params.get("contactName", ""),
                    publicKey=params.get("publicKey", "")
                )
            elif task_type == "list_contacts":
                print("foo")
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
    
    def _handle_login(self, query: str, session_id: str) -> TaskResponse:
        """Handle login task specifically"""
        # Extrair email da query
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, query)
        
        if not emails:
            return TaskResponse(
                message="Por favor, forneça um email válido para fazer login. Exemplo: 'fazer login com email@exemplo.com'",
                task="clarification_needed",
                params={}
            )
        
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
            return TaskResponse(
                message=f"Login realizado com sucesso! Bem-vindo, {email}",
                task="login",
                params={"email": email, "success": True, "tool_result": login_result}
            )
        else:
            return TaskResponse(
                message=f"Falha no login: {login_result.get('message')}",
                task="login",
                params={"email": email, "success": False, "tool_result": login_result}
            )


if __name__ == "__main__":
    crew = StellarConverseCrew()
    
    print("\n🚀 Stellar Assistant is ready with Pydantic output! Type 'exit' to quit.")
    print("📱 Note: This is a demo session. In production, session_id would come from WhatsApp user ID.")
    
    demo_session_id = "demo_user_session"

    # Teste de login
    print("\n--- Teste de Login ---")
    response: TaskResponse = crew.process_query("login usuario@exemplo.com", demo_session_id)
    print(f"Task: {response.task}")
    print(f"Message: {response.message}")
    print(f"Params: {response.params}")

    # Teste de listagem de contatos
    print("\n--- Teste de Lista de Contatos ---")
    response: TaskResponse = crew.process_query("liste todos os contatos", demo_session_id)
    print(f"Task: {response.task}")
    print(f"Message: {response.message}")
    print(f"Params: {response.params}")

    # Loop interativo
    print("\n--- Modo Interativo ---")
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        
        response: TaskResponse = crew.process_query(user_input, demo_session_id)
        print(f"Bot Task: {response.task}")
        print(f"Bot Message: {response.message}")
        
        if response.params:
            print(f"Parameters: {response.params}")
        
        if "tool_result" in response.params:
            print(f"Tool Result: {response.params['tool_result']}")
        
        print("-" * 50)