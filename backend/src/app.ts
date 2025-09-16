import express from 'express';
import actionsRouter from './api/routes/actions.router';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/actions', actionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;