from crewai import Agent, Task, Crew, Process
from langchain_openai import OpenAI
import os
from dotenv import load_dotenv

class SimpleAgent:
    def __init__(self):
        load_dotenv()
        self.llm = OpenAI(
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            max_tokens=1000
        )

    def run(self, query: str, output_file: str = "decision_output.json"):
        agent = Agent(
            role="Simple Task Mapper",
            goal="Convert a user query into a structured JSON TaskResponse object.",
            backstory="You only produce structured JSON for backend execution.",
            llm=self.llm,
            verbose=True
        )

        description = f"""
        Convert the following user query into a valid JSON object.

        User Query: "{query}"

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
        - execute_payment: {{ "destination": "", "amount": "", "assetCode": "", "memo": "" }}
        - execute_path_payment: {{ "destination": "", "destAsset": "", "destAmount": "", "sourceAsset": "" }}
        - initiate_pix_deposit: {{ "amount": "", "assetCode": "" }}
        - clarification_needed: {{ "message": "" }}

        ### Rules:
        - Respond ONLY with the JSON object.
        - Never include explanations, markdown, or text outside JSON.
        """

        task = Task(
            description=description,
            agent=agent,
            expected_output="A single valid JSON object.",
            output_file=output_file
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

        


        return result


if __name__ == "__main__":
    sa = SimpleAgent()
    
    queries = [
        "I want to send 50 USD to Alice with a note saying 'Dinner payment'.",
        "What's my current account balance?",
        "Add Bob to my contacts with public key GABCD1234EFGH5678"
    ]
    for i, query in enumerate(queries):
        sa.run(query, output_file=f"decision_output_{i}.json")
