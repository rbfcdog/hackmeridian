# Agente CrewAI Stateful com Autenticação JWT

Este projeto implementa um agente conversacional CrewAI que gerencia sessões de usuário e autenticação JWT para interagir com uma API backend protegida.

## Características Principais

### 🔐 Autenticação Stateful
- **Gerenciamento de Sessão**: Cada usuário (identificado por `session_id`) mantém sua própria sessão
- **Token JWT**: Obtido via endpoint `/login` da API backend
- **Proteção de Recursos**: Todas as operações sensíveis requerem autenticação

### 🤖 Agente Inteligente
- **Análise de Intenção**: O agente determina automaticamente se o usuário precisa fazer login
- **Fluxo Conversacional**: Guia o usuário através do processo de autenticação
- **Ferramentas Protegidas**: Todas as chamadas para a API usam tokens JWT

## Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp Bot  │───▶│  CrewAI Agent   │───▶│  Node.js API    │
│                 │    │                 │    │                 │
│ session_id:     │    │ SESSION_STORAGE │    │ JWT Protected   │
│ +5521999999999  │    │ - sessionToken  │    │ Endpoints       │
│                 │    │ - userId        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Estrutura do Código

### SESSION_STORAGE
```python
SESSION_STORAGE = {
    "whatsapp:+5521999999999": {
        "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "userId": "user123",
        "email": "user@example.com"
    }
}
```

### Ferramentas Implementadas

#### 🔓 Ferramentas Públicas
- `LoginTool`: Autentica usuário via email
- `OnboardUserTool`: Cria nova conta (se implementada)

#### 🔒 Ferramentas Protegidas (Requerem JWT)
- `AddContactTool`: Adiciona contato à lista
- `ListContactsTool`: Lista todos os contatos
- `GetAccountBalanceTool`: Consulta saldo da conta
- `ExecutePaymentTool`: Executa transações Stellar

## Fluxo de Autenticação

### 1. Primeira Interação (Usuário não autenticado)
```
Usuário: "qual meu saldo?"
Agente: "Você precisa fazer login primeiro. Por favor, envie seu email..."
```

### 2. Processo de Login
```
Usuário: "fazer login com dev@hackathon.com"
Agente: 
1. Extrai email da mensagem
2. Chama LoginTool
3. Salva token em SESSION_STORAGE
4. Confirma login bem-sucedido
```

### 3. Operações Autenticadas
```
Usuário: "qual meu saldo?"
Agente:
1. Verifica token em SESSION_STORAGE
2. Chama GetAccountBalanceTool com token
3. Retorna resultado da API
```

## Exemplos de Uso

### Login
```python
# Input
query = "fazer login com dev@hackathon.com"
session_id = "whatsapp:+5521999999999"

# Output
{
    "message": "Login realizado com sucesso! Bem-vindo, dev@hackathon.com",
    "task": "login",
    "params": {"email": "dev@hackathon.com", "success": True}
}
```

### Consulta de Saldo (Autenticado)
```python
# Input
query = "qual meu saldo?"
session_id = "whatsapp:+5521999999999"

# Output
{
    "message": "Consultando os saldos da sua carteira...",
    "task": "get_account_balance",
    "params": {},
    "tool_result": {
        "success": true,
        "balances": [...]
    }
}
```

### Adicionar Contato
```python
# Input
query = "adicionar Maria com chave GABCD...XYZ"

# Output
{
    "message": "Adicionando Maria (GABCD...XYZ) aos seus contatos.",
    "task": "add_contact", 
    "params": {"contactName": "Maria", "publicKey": "GABCD...XYZ"},
    "tool_result": {"success": true, "message": "Contact added successfully"}
}
```

## Configuração

### Variáveis de Ambiente
```bash
NODE_API_BASE_URL=http://localhost:3001
INTERNAL_API_SECRET=your-shared-secret
OPENAI_API_KEY=your-openai-key
```

### Executar o Agente
```bash
# Modo interativo
python agent.py

# Servidor FastAPI
uvicorn app:app --reload

# Demo automático
python demo.py
```

## Integração com WhatsApp

### Estrutura da Requisição
```python
POST /query
{
    "query": "fazer login com user@example.com",
    "session_id": "whatsapp:+5521999999999"
}
```

### Verificar Status da Sessão
```python
GET /session/whatsapp:+5521999999999
{
    "session_id": "whatsapp:+5521999999999",
    "authenticated": true,
    "user_id": "user123",
    "email": "user@example.com"
}
```

## Tarefas Suportadas

| Tarefa | Autenticação | Descrição |
|--------|-------------|-----------|
| `login` | ❌ Pública | Autentica usuário via email |
| `onboard_user` | ❌ Pública | Cria nova conta |
| `add_contact` | ✅ Protegida | Adiciona contato |
| `list_contacts` | ✅ Protegida | Lista contatos |
| `lookup_contact` | ✅ Protegida | Busca contato específico |
| `get_account_balance` | ✅ Protegida | Consulta saldo |
| `get_operations_history` | ✅ Protegida | Histórico de operações |
| `execute_payment` | ✅ Protegida | Executa pagamento |
| `execute_path_payment` | ✅ Protegida | Pagamento com conversão |
| `initiate_pix_deposit` | ✅ Protegida | Depósito via PIX |

## Segurança

- **Tokens JWT**: Verificados pelo backend Node.js
- **Headers Protegidos**: `Authorization: Bearer <token>` + `x-internal-secret`
- **Isolamento de Sessão**: Cada usuário tem sua própria sessão isolada
- **Validação de Email**: Extração automática e validação de emails nas mensagens

## Próximos Passos

1. **Persistência**: Migrar SESSION_STORAGE para Redis/Database
2. **Timeout de Sessão**: Implementar expiração automática de tokens
3. **Refresh Token**: Renovação automática de tokens expirados
4. **Logs de Auditoria**: Rastreamento de todas as operações autenticadas
5. **Rate Limiting**: Proteção contra abuse de login

## Troubleshooting

### Erro de Autenticação
```
"message": "Você precisa fazer login primeiro..."
```
**Solução**: Usuário deve enviar email para fazer login

### Erro de Token Inválido
```
"tool_result": {"success": false, "message": "Token invalid"}
```
**Solução**: Fazer login novamente para obter novo token

### Erro de Conexão com API
```
"message": "An unexpected error occurred during login"
```
**Solução**: Verificar se a API Node.js está rodando e acessível