from crewai import Agent, Task, Crew, Process
from crewai_tools import JSONSearchTool
from langchain_openai import OpenAI
import os
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
import json

class UserInfo(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    kyc_completed: bool = False
    transaction_history: List[Dict[str, Any]] = []
    account_status: Optional[str] = "inactive"


class TaskResponse(BaseModel):  
    message: str
    task: str
    params: Dict[str, Any]


class StellarConverseCrew:
    """
    Stellar Converse Crew with ONE agent.
    The single agent decides which task to execute (retrieval or modification).
    """

    def __init__(self):
        load_dotenv()
        self.llm = OpenAI(
            temperature=0.3,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            max_tokens=2000
        )

        # Keep user session
        self.user_session = json.load(open('decision_output.json', 'r'))
        self.user_session = json.dumps(self.user_session)

        print(self.user_session)

    def main_agent(self) -> Agent:
        """Single agent that decides which task to execute"""
        return Agent(
            role="Stellar Assistant",
            goal="Understand the user query and decide which backend task to execute.",
            backstory="""You are a Stellar WhatsApp bot agent. 
            You can fetch existing information (balance, history, profile, account status) 
            OR modify/create information (register, create wallet, send payments).
            
            Always respond in JSON format:
            {
                "message": "User-friendly explanation",
                "task": "backend_endpoint_name",
                "params": {"key": "value pairs"}
            }
            
            Retrieval tasks:
            - get_user_profile
            - get_wallet_balance
            - get_transaction_history
            - get_account_status
            
            Modification tasks:
            - payment_incomplete or payment_commit 
            Params MUST follow the `operations` schema:
            {
                "receiver_key": "<stellar_public_key from contacts>",
                "type": "payment",
                "status": "pending",
                "amount": "<numeric>",
                "asset_code": "<currency code>",
                "context": {
                "memo": "<optional note>",
                "receiver_name": "<contact_name>"
                },
                "destination_key": "<stellar_public_key from contacts>"

                Also you should make sure, if the user didnt give all the necessary information, to them to give
                all of it. when it has all of it, should give commit option. 

                if the user already gave information before, its stored in this, so only change the already existing info
                if its explicit, add other stuff the user asks, 
            }
            """  + self.user_session,
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=3
        )

    def process_query(self, query: str):
        """
        Main entry point - single agent decides which backend task to run
        """
        agent = self.main_agent()

        # Only ONE task here — the agent itself chooses the backend function
        decision_task = Task(
            description=f'User query: "{query}"\n\n.',
            agent=agent,
            expected_output="JSON object with {message, task, params}",
            output_pydantic=TaskResponse,
            output_file='decision_output.json', 
            tools=[JSONSearchTool(json_path="contacts.json")]  # Example tool to access contacts
        )

        # if os.path.exists('decision_output.json'):
        #     with open('decision_output.json', 'r') as f:
        #         decision_data = f.read()

        #         if decision_data.task == "send_payment":

        #             specific_task = Task(
        #                 description=f'Execute the task: {decision_data.task} with params {decision_data.params}',
        #                 agent=agent,
        #                 expected_output="Result of the specific backend task",
        #                 output_pydantic=TaskResponse,
        #                 output_file='specific_task_output.json'
        #             )
        #         else:
        #             specific_task = None


        crew = Crew(
            agents=[agent],
            tasks=[decision_task],  # Include the specific task decided by the agent
            process=Process.sequential,  # simpler since it's just one agent
            verbose=True
        )

        curr_state = json.dumps(json.load(open('decision_output.json', 'r')))

        

        result = crew.kickoff()
        return result


if __name__ == "__main__":
    crew = StellarConverseCrew()
    
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        response = crew.process_query(user_input)
        print("Bot:", response)
