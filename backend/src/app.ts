// src/app.ts
import express from 'express';
import actionsRouter from './api/routes/actions.router';

const app = express();

// Middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Conecta o roteador principal da nossa API
app.use('/api/actions', actionsRouter);

// Middleware para rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;