// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import actionsRouter from './api/routes/actions.router'; // Importando nosso novo roteador

dotenv.config();

const app = express();

// Middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check (ótima prática!)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Conecta o roteador principal da nossa API
// Todas as nossas "ferramentas" estarão sob o prefixo /api/actions
app.use('/api/actions', actionsRouter);

// Middleware para rotas não encontradas (404)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;