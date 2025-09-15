import express from 'express';
import dotenv from 'dotenv';

import { TransactionService } from './services/transactionService';
import { Account, Operation, Asset, Memo, Keypair, Networks, TransactionBuilder } from "stellar-base";




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

app.get('/create_account', async (req, res) => {
  try {
    const result = await TransactionService.createTestAccount();
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.post("  ", async (req, res) => {
  try {
    const { destination, amount, memoText } = req.body;

    // chave de origem
    const sourceKeypair = Keypair.random();
    const source = new Account(sourceKeypair.publicKey(), "1");

    // construir transação
    const tx = new TransactionBuilder(source, {
      fee: "100",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.payment({
        destination,
        amount,
        asset: Asset.native()
      }))
      .addMemo(memoText ? Memo.text(memoText) : Memo.none())
      .setTimeout(30)
      .build();

    // assinar
    tx.sign(sourceKeypair);

    res.json({
      success: true,
      xdr: tx.toXDR(),
      signer: sourceKeypair.publicKey(),
      signatures: tx.signatures.length
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
