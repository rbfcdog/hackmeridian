from crewai import Agent, Task, Crew, Process
from crewai_tools import JSONSearchTool
from langchain_openai import OpenAI
import os
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Literal
from dotenv import load_dotenv
import json
from enum import Enum

class ConversationState(str, Enum):
    INITIAL = "initial"
    GATHERING_INFO = "gathering_info"
    READY_TO_EXECUTE = "ready_to_execute"
    EXECUTING = "executing"
    COMPLETED = "completed"
    ERROR = "error"

class ActionType(str, Enum):
    PAYMENT = "payment"
    PATH_PAYMENT = "path_payment"
    BALANCE_INQUIRY = "balance_inquiry"
    CONTACT_MANAGEMENT = "contact_management"
    TRANSACTION_HISTORY = "transaction_history"
    ONBOARDING = "onboarding"
    PIX_DEPOSIT = "pix_deposit"

class TaskResponse(BaseModel):
    message: str
    action_type: Optional[ActionType] = None
    conversation_state: ConversationState
    collected_data: Dict[str, Any] = {}
    missing_fields: List[str] = []
    next_questions: List[str] = []
    ready_to_execute: bool = False
    execution_params: Optional[Dict[str, Any]] = None
    ui_actions: List[Dict[str, Any]] = []  # For frontend buttons/actions

class ConversationSession(BaseModel):
    user_id: Optional[str] = None
    current_action: Optional[ActionType] = None
    state: ConversationState = ConversationState.INITIAL
    collected_data: Dict[str, Any] = {}
    context_history: List[Dict[str, Any]] = []

class StellarConverseMultiAgentCrew:
    """
    Multi-agent architecture for Stellar conversational interface
    """
    
    def __init__(self):
        load_dotenv()
        self.llm = OpenAI(
            temperature=0.3,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            max_tokens=2000
        )
            CONTACT_MANAGEMENT = "contact_management"
    TRANSACTION_HISTORY = "transaction_history"
    ONBOARDING = "onboarding"
    PIX_DEPOSIT = "pix_deposit"

        # Load or initialize conversation session
        try:
            with open('conversation_session.json', 'r') as f:
                session_data = json.load(f)
                self.session = ConversationSession(**session_data)
        except:
            self.session = ConversationSession()
    
    def save_session(self):
        """Persist conversation session"""
        with open('conversation_session.json', 'w') as f:
            json.dump(self.session.dict(), f, indent=2)

    def intent_classifier_agent(self) -> Agent:
        """Agent responsible for understanding user intent and classifying actions"""
        return Agent(
            role="Intent Classifier",
            goal="Analyze user messages to understand their intent and classify the required action type.",
            backstory="""You are an expert at understanding user intentions in financial conversations.
            You can identify when users want to:
            - Send payments (direct or currency conversion)
            - Check balances
            - View transaction history
            - Manage contacts
            - Deposit money via PIX
            - Get help with onboarding
            
            You should classify the intent and determine if this is a new conversation or continuation.""",
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=3
        )

    def data_collector_agent(self) -> Agent:
        """Agent responsible for gathering required information for specific actions"""
        return Agent(
            role="Data Collector",
            goal="Collect all necessary information for the identified action, asking clarifying questions when needed.",
            backstory=f"""You a    CONTACT_MANAGEMENT = "contact_management"
    TRANSACTION_HISTORY = "transaction_history"
    ONBOARDING = "onboarding"
    PIX_DEPOSIT = "pix_deposit"
re responsible for gathering complete information for financial operations.
            
            Current session state: {self.session.state}
            Current action: {self.session.current_action}
            Already collected: {json.dumps(self.session.collected_data, indent=2)}
            
            For PAYMENT operations, you need:
            - recipient (contact name or stellar address)
            - amount (numeric v    CONTACT_MANAGEMENT = "contact_management"
    TRANSACTION_HISTORY = "transaction_history"
    ONBOARDING = "onboarding"
    PIX_DEPOSIT = "pix_deposit"
alue)
            - asset_code (currency: XLM, USDC, BRLC, etc.)
            - memo (optional)
            
            For PATH_PAYMENT (currency conversion), you need:
            - recipient
            - destination_amount and destination_asset
            - source_asset (what user wants to send from)
            - memo (optional)
            
            For CONTACT_MANAGEMENT:
            - contact_name
            - stellar_public_key (for adding contacts)
            
            Ask specific questions to fill missing information. Be conversational and helpful.""",
            tools=[JSONSearchTool(json_path="contacts.json")],
            llm=self.llm,
            verbose=True,
            max_iter=3
        )

    def validation_agent(self) -> Agent:
        """Agent responsible for validating collected data and preparing execution"""
        return Agent(
            role="Data Validator",
            goal="Validate collected information and prepare parameters for backend execution.",
            backstory="""You validate that all required information is present and correct.
            You also translate contact names to stellar addresses using the contacts database.
            You prepare the final execution parameters that match the API endpoints.
            
            When all data is complete and valid, you set ready_to_execute=True and provide
            proper execution_params for the backend API calls.""",
            tools=[JSONSearchTool(json_path="contacts.json")],
            llm=self.llm,
            verbose=True,    CONTACT_MANAGEMENT = "contact_management"
    TRANSACTION_HISTORY = "transaction_history"
    ONBOARDING = "onboarding"
    PIX_DEPOSIT = "pix_deposit"

            max_iter=3
        )

    def response_formatter_agent(self) -> Agent:
        """Agent responsible for formatting user-friendly responses and UI actions"""
        return Agent(
            role="Response Formatter",
            goal="Create user-friendly messages and determine appropriate UI actions.",
            backstory="""You create clear, friendly responses for users and determine what UI elements
            should be shown (buttons, confirmations, etc.).
            
            When ready_to_execute=True, you should create a UI action for confirmation:
            - For payments: "Confirm Payment" button
            - For deposits: "Proceed to PIX" button
            - etc.
            
            Your messages should be natural and helpful, guiding users through the process.""",
            tools=[],
            llm=self.llm,
            verbose=True,
            max_iter=3
        )

    def create_tasks(self, user_message: str) -> List[Task]:
        """Create tasks for the multi-agent workflow"""
        
        # Task 1: Classify Intent
        intent_task = Task(
            description=f"""
            Analyze this user message: "{user_message}"
            
            Current conversation state: {self.session.state}
            Current action: {self.session.current_action}
            
            Determine:
            1. What action type is this? (payment, balance_inquiry, etc.)
            2. Is this a new conversation or continuation?
            3. What is the new conversation state?
            """,
            agent=self.intent_classifier_agent(),
            expected_output="JSON with action_type and conversation_state analysis"
        )
        
        # Task 2: Collect Required Data
        data_collection_task = Task(
            description=f"""
            Based on the classified intent, collect all necessary information.
            
            User message: "{user_message}"
            Previously collected data: {json.dumps(self.session.collected_data)}
            
            Identify:
            1. What new information was provided?
            2. What information is still missing?
            3. What questions should we ask next?
            
            Update the collected_data with new information.
            """,
            agent=self.data_collector_agent(),
            tools=[JSONSearchTool(json_path="contacts.json")],
            expected_output="JSON with updated collected_data, missing_fields, and next_questions"
        )
        
        # Task 3: Validate and Prepare Execution
        validation_task = Task(
            description=f"""
            Validate the collected information and prepare for execution if complete.
            
            Collected data: {json.dumps(self.session.collected_data)}
            Action type: {self.session.current_action}
            
            Tasks:
            1. Validate all required fields are present
            2. Resolve contact names to stellar addresses
            3. Prepare execution_params if ready
            4. Set ready_to_execute flag appropriately
            """,
            agent=self.validation_agent(),
            expected_output="JSON with validation results and execution_params"
        )
        
        # Task 4: Format Response
        formatting_task = Task(
            description="""
            Create the final user response and UI actions.
            
            Based on the previous tasks:
            1. Create a friendly, helpful message for the user
            2. Determine appropriate UI actions (buttons, etc.)
            3. Guide the user through next steps
            """,
            agent=self.response_formatter_agent(),
            expected_output="Complete TaskResponse with message, UI actions, and all metadata",
            output_pydantic=TaskResponse
        )
        
        return [intent_task, data_collection_task, validation_task, formatting_task]

    def process_message(self, user_message: str) -> TaskResponse:
        """Main entry point for processing user messages"""
        
        # Create agents and tasks
        tasks = self.create_tasks(user_message)
        
        # Create crew with all agents
        crew = Crew(
            agents=[
                self.intent_classifier_agent(),
                self.data_collector_agent(), 
                self.validation_agent(),
                self.response_formatter_agent()
            ],
            tasks=tasks,
            process=Process.sequential,
            verbose=True
        )
        
        # Execute workflow
        result = crew.kickoff()
        
        # Update session with results
        if isinstance(result, TaskResponse):
            self.session.state = result.conversation_state
            self.session.current_action = result.action_type
            self.session.collected_data.update(result.collected_data)
            
            # Add to context history
            self.session.context_history.append({
                "user_message": user_message,
                "bot_response": result.message,
                "timestamp": "now"  # Add proper timestamp
            })
            
            self.save_session()
            return result
        else:
            # Fallback response
            return TaskResponse(
                message="I encountered an issue processing your request. Please try again.",
                conversation_state=ConversationState.ERROR
            )

    def handle_confirmation(self, confirmed: bool) -> TaskResponse:
        """Handle user confirmation for execution"""
        if not confirmed:
            self.session.state = ConversationState.INITIAL
            self.session.collected_data = {}
            self.save_session()
            return TaskResponse(
                message="Operation cancelled. How else can I help you?",
                conversation_state=ConversationState.INITIAL
            )
        
        # Here you would call the actual backend API
        # For now, simulate execution
        self.session.state = ConversationState.EXECUTING
        self.save_session()
        
        return TaskResponse(
            message="Executing your request...",
            conversation_state=ConversationState.EXECUTING,
            ui_actions=[{"type": "show_loading", "message": "Processing transaction..."}]
        )

    def reset_session(self):
        """Reset conversation session"""
        self.session = ConversationSession()
        self.save_session()


# Usage example and CLI interface
if __name__ == "__main__":
    crew = StellarConverseMultiAgentCrew()
    
    print("Stellar Assistant Multi-Agent System")
    print("Type 'reset' to clear session, 'exit' to quit")
    print("-" * 50)
    
    while True:
        user_input = input("\nUser: ").strip()
        
        if user_input.lower() in ["exit", "quit"]:
            break
        elif user_input.lower() == "reset":
            crew.reset_session()
            print("Session reset.")
            continue
        elif user_input.lower() == "confirm":
            response = crew.handle_confirmation(True)
        elif user_input.lower() == "cancel":
            response = crew.handle_confirmation(False)
        else:
            response = crew.process_message(user_input)
        
        print(f"\nBot: {response.message}")
        
        if response.ready_to_execute:
            print("\n🔘 Ready to execute! Type 'confirm' or 'cancel'")
        
        if response.missing_fields:
            print(f"ℹ️  Still need: {', '.join(response.missing_fields)}")
        
        if response.ui_actions:
            print(f"🎛️  UI Actions: {response.ui_actions}")
            
        print(f"📊 State: {response.conversation_state}")