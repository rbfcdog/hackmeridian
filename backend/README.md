# Meridian Backend

Backend básico para o projeto Meridian com Node.js, Express e TypeScript.

## Instalação

```bash
cd meridian-back
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Estrutura

```
src/
├── modules/           # Módulos da aplicação
│   ├── auth/         # Autenticação
│   ├── stellar/      # Integração Stellar
│   ├── transactions/ # Transações
│   └── users/        # Usuários
├── shared/           # Código compartilhado
│   ├── config/       # Configurações
│   ├── database/     # Database
│   ├── middleware/   # Middlewares
│   └── utils/        # Utilitários
├── app.ts           # App Express
└── server.ts        # Servidor HTTP
```
