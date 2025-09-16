from crewai import Agent, Task, Crew, Process
from crewai_tools import JSONSearchTool
from langchain_openai import OpenAI
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from enum import Enum
import os
import json
from dotenv import load_dotenv

# --- Enums ---
class ConversationState(str, Enum):
    INITIAL = "initial"
    GATHERING_INFO = "gathering_info"
    READY_TO_EXECUTE = "ready_to_execute"
    ERROR = "error"

class ActionType(str, Enum):
    PAYMENT = "payment"
    BALANCE_INQUIRY = "balance_inquiry"
    PATH_PAYMENT = "path_payment"
    CONTACT_MANAGEMENT = "contact_management"

# --- Models ---
class TaskResponse(BaseModel):
    message: str
    action_type: Optional[ActionType] = None
    conversation_state: ConversationState
    collected_data: Dict[str, Any] = {}
    missing_fields: List[str] = []
    ready_to_execute: bool = False
    execution_params: Optional[Dict[str, Any]] = None

class StellarSimpleCrew:
    def __init__(self):
        load_dotenv()
        self.llm = OpenAI(
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            max_tokens=1500
        )
        self.session = {
            "collected_data": {},
            "current_action": None,
            "state": ConversationState.INITIAL
        }

    # --- Agents ---
    def intent_agent(self) -> Agent:
        return Agent(
            role="Intent Analysis",
            goal="Identify what the user wants to do: payment, balance inquiry, etc.",
            backstory="You are an expert at classifying user intents in finance conversations.",
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=2
        )

    def data_checker_agent(self) -> Agent:
        return Agent(
            role="Data Checker",
            goal="Check if all required parameters for the identified action type are present.",
            backstory="You know the required fields for each financial operation. Return a list of missing fields.",
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=2
        )

    def missing_data_agent(self) -> Agent:
        return Agent(
            role="Missing Data Responder",
            goal="If any required parameters are missing, generate a message asking the user to provide them.",
            backstory="You are friendly and conversational when asking for missing information.",
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=2
        )

    def generate_execution_agent(self) -> Agent:
        return Agent(
            role="Execution JSON Generator",
            goal="If all parameters are present, generate the final JSON ready for API execution.",
            backstory="You format the collected data into the correct structure for backend execution.",
            llm=self.llm,
            verbose=True,
            max_iter=2,
            tools=[JSONSearchTool(json_path="contacts.json")]  # Example tool to access contacts
        )

    # --- Pipeline ---
    def process_message(self, user_message: str) -> TaskResponse:
        # Step 1: Intent
        intent_task = Task(
            description=f"Classify the action type from: '{user_message}'",
            agent=self.intent_agent(),
            expected_output="JSON with action_type"
        )

        # Step 2: Check data
        data_task = Task(
            description=f"Check if all required parameters for the action are present. Current data: {json.dumps(self.session['collected_data'])}",
            agent=self.data_checker_agent(),
            expected_output="JSON with missing_fields and updated collected_data",
            context=[intent_task]
        )

        # Step 3: Handle missing data
        missing_task = Task(
            description="Generate a user message asking for missing parameters if any",
            agent=self.missing_data_agent(),
            expected_output="Message asking for missing fields",
            context=[data_task]
        )

        # Step 4: Generate execution JSON
        execution_task = Task(
            description="Generate the execution JSON if all parameters are present",
            agent=self.generate_execution_agent(),
            expected_output="Final JSON ready for backend API",
            tools=[JSONSearchTool(json_path="contacts.json")],  # Example tool to access contacts
            context=[data_task, missing_task]
        )

        # Create Crew with sequential execution
        crew = Crew(
            agents=[
                self.intent_agent(),
                self.data_checker_agent(),
                self.missing_data_agent(),
                self.generate_execution_agent()
            ],
            tasks=[intent_task, data_task, missing_task, execution_task],
            process=Process.sequential,
            verbose=True
        )

        result = crew.kickoff()

        # Process result (simplified)
        if isinstance(result, dict):
            missing_fields = result.get("missing_fields", [])
            ready = len(missing_fields) == 0
            self.session['state'] = ConversationState.READY_TO_EXECUTE if ready else ConversationState.GATHERING_INFO
            self.session['collected_data'].update(result.get("collected_data", {}))
            return TaskResponse(
                message=result.get("message", ""),
                action_type=ActionType(result.get("action_type")) if result.get("action_type") else None,
                conversation_state=self.session['state'],
                collected_data=self.session['collected_data'],
                missing_fields=missing_fields,
                ready_to_execute=ready,
                execution_params=result.get("execution_params")
            )

        return TaskResponse(
            message="Error processing request.",
            conversation_state=ConversationState.ERROR
        )

# --- CLI demo ---
if __name__ == "__main__":
    assistant = StellarSimpleCrew()
    print("Stellar Simple Assistant")
    print("Type 'reset' to clear session, 'exit' to quit")
    print("-"*50)

    while True:
        user_input = input("\nUser: ").strip()
        if user_input.lower() in ["exit", "quit"]:
            break
        
        response = assistant.process_message(user_input)
        print("\nBot:", response.message)

       
