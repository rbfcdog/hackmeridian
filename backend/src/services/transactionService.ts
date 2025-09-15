import {
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Networks,
  Memo,
} from '@stellar/stellar-sdk';
import fetch from 'node-fetch';
import { server, stellarConfig } from '../config/stellar';
import { loadAccount, submitTransaction, createMemo, createAsset } from '../utils /stellar';
import { SupabaseService } from './supabaseService';
import { PaymentRequest, CreateAccountRequest, TransactionRecord } from '../types';

export class TransactionService {
  static async createPayment(request: PaymentRequest): Promise<TransactionRecord> {
    const sourceKeypair = Keypair.fromSecret(request.sourceSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    const transactionRecord = await SupabaseService.createTransactionRecord({
      source_account: sourcePublicKey,
      destination_account: request.destination,
      operation_type: 'payment',
      amount: request.amount,
      asset_code: request.assetCode || 'XLM',
      memo: request.memo,
      status: 'pending',
      transaction_hash: '',
    });

    try {
      const sourceAccount = await loadAccount(sourcePublicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: stellarConfig.network,
      })
        .addOperation(
          Operation.payment({
            destination: request.destination,
            asset: createAsset(request.assetCode, request.assetIssuer),
            amount: request.amount,
          })
        )
        .setTimeout(300)
        .addMemo(createMemo(request.memo) || Memo.none())
        .build();

      transaction.sign(sourceKeypair);

      const response = await submitTransaction(transaction);

      return await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        transaction_hash: response.hash,
        status: 'success',
        submitted_at: new Date().toISOString(),
        ledger: response.ledger,
        fee_charged: '10', // erro no parametro do request pra response
        result_xdr: response.result_xdr,
      });
    } catch (error: any) {
      await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        status: 'failed',
        error_message: error.message || 'Unknown error',
        submitted_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  static async createTestAccount() {

    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();
    const secret = keypair.secret();
    
    const response = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`)

    const data = await response.json();
    return { publicKey, secret, friendbotResult: data };
  }


  static async createAccount(request: CreateAccountRequest): Promise<TransactionRecord> {
    const sourceKeypair = Keypair.fromSecret(request.sourceSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    const transactionRecord = await SupabaseService.createTransactionRecord({
      source_account: sourcePublicKey,
      destination_account: request.destination,
      operation_type: 'create_account',
      amount: request.startingBalance,
      asset_code: 'XLM',
      status: 'pending',
      transaction_hash: '',
    });

    try {
      const sourceAccount = await loadAccount(sourcePublicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: stellarConfig.network,
      })
        .addOperation(
          Operation.createAccount({
            destination: request.destination,
            startingBalance: request.startingBalance,
          })
        )
        .setTimeout(300)
        .build();

      transaction.sign(sourceKeypair);

      const response = await submitTransaction(transaction);

      return await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        transaction_hash: response.hash,
        status: 'success',
        submitted_at: new Date().toISOString(),
        ledger: response.ledger,
        fee_charged: '10',
        result_xdr: response.result_xdr,
      });
    } catch (error: any) {
      await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        status: 'failed',
        error_message: error.message || 'Unknown error',
        submitted_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  static async fundTestAccount(publicKey: string): Promise<void> {
    if (stellarConfig.network !== Networks.TESTNET) {
      throw new Error('Friendbot funding only available on testnet');
    }

    try {
      const response = await fetch(`${stellarConfig.friendbotUrl}?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error(`Friendbot request failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to fund account: ${error}`);
    }
  }

  static async changeTrust(
    sourceSecret: string,
    assetCode: string,
    assetIssuer: string,
    limit?: string
  ): Promise<TransactionRecord> {
    const sourceKeypair = Keypair.fromSecret(sourceSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    const transactionRecord = await SupabaseService.createTransactionRecord({
      source_account: sourcePublicKey,
      operation_type: 'change_trust',
      asset_code: assetCode,
      status: 'pending',
      transaction_hash: '',
    });

    try {
      const sourceAccount = await loadAccount(sourcePublicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: stellarConfig.network,
      })
        .addOperation(
          Operation.changeTrust({
            asset: createAsset(assetCode, assetIssuer),
            limit: limit,
          })
        )
        .setTimeout(300)
        .build();

      transaction.sign(sourceKeypair);

      const response = await submitTransaction(transaction);

      return await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        transaction_hash: response.hash,
        status: 'success',
        submitted_at: new Date().toISOString(),
        ledger: response.ledger,
        fee_charged: '10',
        result_xdr: response.result_xdr,
      });
    } catch (error: any) {
      await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        status: 'failed',
        error_message: error.message || 'Unknown error',
        submitted_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  static async manageOffer(
    sourceSecret: string,
    selling: { code?: string; issuer?: string },
    buying: { code?: string; issuer?: string },
    amount: string,
    price: string,
    offerId: number = 0
  ): Promise<TransactionRecord> {
    const sourceKeypair = Keypair.fromSecret(sourceSecret);
    const sourcePublicKey = sourceKeypair.publicKey();

    const transactionRecord = await SupabaseService.createTransactionRecord({
      source_account: sourcePublicKey,
      operation_type: 'manage_sell_offer',
      amount: amount,
      status: 'pending',
      transaction_hash: '',
    });

    try {
      const sourceAccount = await loadAccount(sourcePublicKey);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: stellarConfig.network,
      })
        .addOperation(
          Operation.manageSellOffer({
            selling: createAsset(selling.code, selling.issuer),
            buying: createAsset(buying.code, buying.issuer),
            amount: amount,
            price: price,
            offerId: offerId,
          })
        )
        .setTimeout(300)
        .build();

      transaction.sign(sourceKeypair);

      const response = await submitTransaction(transaction);

      return await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        transaction_hash: response.hash,
        status: 'success',
        submitted_at: new Date().toISOString(),
        ledger: response.ledger,
        fee_charged: '10',
        result_xdr: response.result_xdr,
      });
    } catch (error: any) {
      await SupabaseService.updateTransactionRecord(transactionRecord.id!, {
        status: 'failed',
        error_message: error.message || 'Unknown error',
        submitted_at: new Date().toISOString(),
      });
      throw error;
    }
  }
}
