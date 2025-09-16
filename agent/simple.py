from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from crewai_tools import JSONSearchTool
from langchain_openai import OpenAI
import requests
import os
import json 
from dotenv import load_dotenv


# Gerenciador de sessão em memória
# A chave é o ID do usuário da plataforma de chat (ex: 'whatsapp:+5521999999999')
SESSION_STORAGE = {}
USER_INFO = {}


# Configurações da API
NODE_API_BASE_URL = os.getenv("NODE_API_BASE_URL", "http://localhost:3001")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "hackathon-secret-2024")

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
            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/list-contacts",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "message": "Failed to list contacts."}
        

class ExecutePaymentTool(BaseTool):
    name: str = "Execute Payment Tool"
    description: str = "Executes a payment transaction."

    def _run(self, session_token: str, destination: str, amount: str, assetCode: str, memo: str = "", secretKey: str = "") -> dict:
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {session_token}",
                "x-internal-secret": INTERNAL_API_SECRET
            }
            payload = {
                "destination": destination,
                "amount": amount,
                "asset_code": assetCode,
                "memo": memo
            }

            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/build-payment-xdr",
                headers=headers,
                json=payload
            )


            response = requests.post(
                f"{NODE_API_BASE_URL}/api/actions/sign-and",
                headers=headers,
                json=payload
            )
            print(response)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "message": "Failed to execute payment."}
        

class SimpleAgent:
    def __init__(self):
        load_dotenv()
        self.llm = OpenAI(
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            max_tokens=1000
        )

        self.login_tool = LoginTool()
        self.list_contacts_tool = ListContactsTool()
        self.execute_payment_tool = ExecutePaymentTool()

        self.transaction_register = {}
        self.secret_key_mode = False


    def run(self, query: dict, output_file: str = "decision_output.json", session_id: str = "default_session"):

        contact_search_tool = JSONSearchTool(
            name="Contacts JSON Search Tool",
            description="Searches a local JSON file for contact information.",
            json_path="contacts.json"
        )

        issuers_search_tool = JSONSearchTool(
            name="Issuers Search Tool",
            description="Searches a local JSON file for issuers code",
            json_path="issuers.json"
        )

        agent = Agent(
            role="Simple Task Mapper",
            goal="Convert a user query into a structured JSON TaskResponse object.",
            backstory="You only produce structured JSON for backend execution.",
            llm=self.llm,
            verbose=True,
            tools=[contact_search_tool, issuers_search_tool]
        )


        if self.secret_key_mode:
            print("SECRETTTTTTTTTTTTTTTT")
            secret_key = query["query"]
            task_data = self.transaction_register
            print(task_data)
            session_token = SESSION_STORAGE.get(session_id).get("sessionToken")
            payment_result = self.execute_payment_tool._run(
                session_token=session_token,
                destination=task_data["params"]["destination"],
                amount=task_data["params"]["amount"],
                assetCode=task_data["params"]["issuer"],
                memo=task_data["params"]["memo"],
                secretKey=secret_key
            )
            context = json.dumps(payment_result)

            return context


        description = f"""
        Convert the following user query into a valid JSON object.

        User Query: "{query["query"]}"

        ### JSON Schema (must follow exactly):
        {{
          "message": "Short explanation in Portuguese of what is being done",
          "task": "task_name_here",
          "params": {{
            "key": "value"
          }}
        }}

        Tasks available:
        - login: {{ "email": "" }}
        - onboard_user: {{ "name": "", "email": "" }}
        - add_contact: {{ "contactName": "", "publicKey": "" }}
        - list_contacts: {{}}
        - lookup_contact: {{ "contactName": "" }}
        - get_account_balance: {{}}
        - get_operations_history: {{}}
        - execute_payment: {{ "destination": "", "amount": "", "issuer": "", "memo": ""}}
        - execute_path_payment: {{ "destination": "", "destAsset": "", "destAmount": "", "sourceAsset": "" }}
        - initiate_pix_deposit: {{ "amount": "", "assetCode": "" }}
        - clarification_needed: {{ "message": "" }}

        For destination paramters, check the contacts list to associate the respective name to the public key
        For the asset, need to get the code present in issuers document

        ### Rules:
        - Respond ONLY with the JSON object.
        - Never include explanations, markdown, or text outside JSON.
        """


        task = Task(
            description=description,
            agent=agent,
            expected_output="A single valid JSON object, no quotes, only the raw json",
            output_file=output_file,
            tools=[contact_search_tool, issuers_search_tool]
        )

        crew = Crew(
            agents=[agent],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )

        result = crew.kickoff()
        print("Result:", result)
        print(f"JSON saved to {output_file}")

        task_data = json.load(open(output_file, "r"))

        public_tasks = ["login", "onboard_user"]

        task_type = task_data["task"]

        session_data = SESSION_STORAGE.get(session_id)

        if task_type not in public_tasks:
            if not session_data or not session_data.get("sessionToken"):
                print("session morreu")
                return {
                    "message": "Você precisa fazer login primeiro. Por favor, envie seu email para autenticar. Exemplo: 'fazer login com email@exemplo.com'",
                    "task": "clarification_needed",
                    "params": {"requires_login": True}
                }
        
        context = ""
        if task_type == "login":
            return self._handle_login(query["query"], session_id)

        elif task_type == "list_contacts":
            session_token = session_data.get("sessionToken")
            contacts = self.list_contacts_tool._run(session_token=session_token)
            context = json.dumps(contacts)

        if task_type == "execute_payment":
            print("enter_pay")
            session_token = session_data.get("sessionToken")    

            self.transaction_register = task_data 
            self.secret_key_mode = True

            return {
                "message": "Por favor, forneça sua chave secreta para autorizar o pagamento.",
                "task": "clarification_needed",
                "params": {"requires_secret_key": True}
            }
        

        return self.final_agent(task_type="list_contacts", context=context)


    def final_agent(self, task_type: str, context: str) -> dict:
        """
        Final agent: takes API context and generates a user-facing answer in the same style as the first agent.
        """
        agent = Agent(
            role="Final Answer Generator",
            goal="Use the context from the API call to generate a user-facing answer in Portuguese.",
            backstory="You receive structured data from an API and must summarize or explain it to the user in a friendly, clear way.",
            llm=self.llm,
            verbose=True
        )
        description = f"""
        You are given the result of an API call for the task: {task_type}.
        Context (JSON): {context}

        Your job is to generate a short, friendly answer in Portuguese for the user, summarizing the result.
        Respond ONLY with the answer, no markdown, no extra text.
        """
        task = Task(
            description=description,
            agent=agent,
            expected_output="A short answer in Portuguese.",
        )

        crew = Crew(
            agents=[agent],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        result = crew.kickoff()
        return {"message": str(result)}
    

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
        login_result = self.login_tool._run(email)

        print(login_result)
        
        if login_result.get("success"):
            # Salvar token na sessão
            SESSION_STORAGE[session_id] = {
                "sessionToken": login_result.get("sessionToken"),
                "userId": login_result.get("userId"),
                "email": email
            }

            session_token = SESSION_STORAGE[session_id].get("sessionToken")
            contacts = self.list_contacts_tool._run(session_token=session_token)
            json.dump(contacts["contacts"], open(f"contacts.json", "w"), indent=2)

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
    sa = SimpleAgent()
    
    queries = [
        "quero logar na conta usuario@exemplo.com",
        "I want to send payment, 1000 BRL to Amigo Jo with a note saying 'Dinner payment'.",
        "senha_hahahaha"
        # "What's my current account balance?",
        # "Add Bob to my contacts with public key GABCD1234EFGH5678"
    ]


    for i, query in enumerate(queries):
        payload = {
            "query": query,
        }

        response = sa.run(payload, output_file=f"decision_output_{i}.json")
