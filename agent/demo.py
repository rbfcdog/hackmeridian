#!/usr/bin/env python3
"""
Demo script para testar o agente CrewAI com autenticação JWT
"""

from agent import StellarConverseCrew, SESSION_STORAGE

def demo_authentication_flow():
    """Demonstra o fluxo de autenticação completo"""
    crew = StellarConverseCrew()
    session_id = "demo_whatsapp_user_123"
    
    print("=== Demo do Agente CrewAI com Autenticação JWT ===\n")
    
    # Teste 1: Tentar acessar funcionalidade protegida sem login
    print("1. Tentando acessar saldo sem estar logado:")
    result = crew.process_query("qual meu saldo?", session_id)
    print(f"Resposta: {result}\n")
    
    # Teste 2: Fazer login
    print("2. Fazendo login:")
    result = crew.process_query("fazer login com usuario@exemplo.com", session_id)
    print(f"Resposta: {result}")
    print(f"Sessão armazenada: {SESSION_STORAGE.get(session_id, {})}\n")
    
    # Teste 3: Acessar funcionalidade protegida após login
    print("3. Tentando acessar saldo após login:")
    result = crew.process_query("qual meu saldo?", session_id)
    print(f"Resposta: {result}\n")
    
    # Teste 4: Adicionar contato
    print("4. Adicionando um contato:")
    result = crew.process_query("adicionar Maria com chave pública GABCD...XYZ", session_id)
    print(f"Resposta: {result}\n")
    
    # Teste 5: Listar contatos
    print("5. Listando contatos:")
    result = crew.process_query("mostrar meus contatos", session_id)
    print(f"Resposta: {result}\n")
    
    print("=== Demo concluído ===")

if __name__ == "__main__":
    demo_authentication_flow()