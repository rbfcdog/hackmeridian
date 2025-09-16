#!/usr/bin/env python3
"""
Demo da Nova Pipeline Unificada com Pydantic Output
===================================================

Este demo mostra como o agente agora retorna objetos TaskResponse estruturados
em vez de strings JSON que precisam ser parseadas manualmente.
"""

from agent import StellarConverseCrew, SESSION_STORAGE, TaskResponse

def demo_unified_pipeline():
    """Demonstra a nova pipeline unificada com objetos Pydantic"""
    crew = StellarConverseCrew()
    session_id = "demo_pydantic_user_123"
    
    print("=== 🚀 Demo da Pipeline Unificada com Pydantic ===\n")
    
    # Teste 1: Login (operação pública)
    print("1️⃣  Fazendo login:")
    result: TaskResponse = crew.process_query("fazer login com dev@hackathon.com", session_id)
    print(f"   Task: {result.task}")
    print(f"   Message: {result.message}")
    print(f"   Success: {result.params.get('success', False)}")
    print(f"   Sessão armazenada: {bool(SESSION_STORAGE.get(session_id))}\n")
    
    # Teste 2: Operação protegida (lista de contatos)
    print("2️⃣  Listando contatos (operação protegida):")
    result: TaskResponse = crew.process_query("quais são meus contatos?", session_id)
    print(f"   Task: {result.task}")
    print(f"   Message: {result.message}")
    print(f"   Has Tool Result: {'tool_result' in result.params}")
    if 'tool_result' in result.params:
        print(f"   Tool Result Success: {result.params['tool_result'].get('success', False)}")
    print()
    
    # Teste 3: Consulta de saldo
    print("3️⃣  Consultando saldo:")
    result: TaskResponse = crew.process_query("qual meu saldo atual?", session_id)
    print(f"   Task: {result.task}")
    print(f"   Message: {result.message}")
    print(f"   Parameters: {result.params}")
    print()
    
    # Teste 4: Adicionando contato
    print("4️⃣  Adicionando contato:")
    result: TaskResponse = crew.process_query("adicionar contato Paulo com chave GTEST123FAKE", session_id)
    print(f"   Task: {result.task}")
    print(f"   Message: {result.message}")
    print(f"   Contact Name: {result.params.get('contactName', 'N/A')}")
    print(f"   Public Key: {result.params.get('publicKey', 'N/A')}")
    print()
    
    # Teste 5: Operação que requer clarificação
    print("5️⃣  Operação ambígua:")
    result: TaskResponse = crew.process_query("enviar dinheiro", session_id)
    print(f"   Task: {result.task}")
    print(f"   Message: {result.message}")
    print()
    
    # Teste 6: Tentativa de operação sem login (novo usuário)
    print("6️⃣  Operação protegida sem login:")
    new_session = "unauthorized_user"
    result: TaskResponse = crew.process_query("ver meu saldo", new_session)
    print(f"   Task: {result.task}")
    print(f"   Message: {result.message}")
    print(f"   Requires Login: {result.params.get('requires_login', False)}")
    print()
    
    print("=== ✅ Demonstração Concluída ===")
    print("\n🎯 Principais Melhorias:")
    print("   • Saída estruturada com Pydantic (sem parsing JSON manual)")
    print("   • Validação automática de tipos")
    print("   • Intellisense completo para result.task, result.message, etc.")
    print("   • Eliminação de erros de parsing JSON")
    print("   • Pipeline mais limpa e fácil de manter")

def demonstrate_type_safety():
    """Demonstra a segurança de tipos da nova abordagem"""
    crew = StellarConverseCrew()
    
    print("\n=== 🔒 Demonstração de Type Safety ===")
    
    # O resultado é garantidamente um objeto TaskResponse
    result: TaskResponse = crew.process_query("fazer login com test@email.com", "type_demo")
    
    # Agora temos intellisense completo e garantias de tipo
    print(f"Task type: {type(result.task)}")  # str
    print(f"Message type: {type(result.message)}")  # str  
    print(f"Params type: {type(result.params)}")  # dict
    
    # Podemos acessar propriedades com confiança
    print(f"Task value: '{result.task}'")
    print(f"Message length: {len(result.message)} characters")
    print(f"Params keys: {list(result.params.keys())}")
    
    # Validação automática garante estrutura correta
    assert hasattr(result, 'task'), "TaskResponse sempre tem 'task'"
    assert hasattr(result, 'message'), "TaskResponse sempre tem 'message'"
    assert hasattr(result, 'params'), "TaskResponse sempre tem 'params'"
    
    print("✅ Todas as verificações de tipo passaram!")

if __name__ == "__main__":
    demo_unified_pipeline()
    demonstrate_type_safety()