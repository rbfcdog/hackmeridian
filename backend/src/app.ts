import express from 'express';
import dotenv from 'dotenv';

import { TransactionService } from './services/transactionService';


dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Meridian Backend API',
    version: '1.0.0'
  });
});

app.get('/create_testnet_account', async (req, res) => {
  try {
    const result = await TransactionService.createTestnetAccount();
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});


export default app;
