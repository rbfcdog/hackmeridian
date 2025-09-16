import {
  Keypair,
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
  MemoType,
  Horizon,
} from '@stellar/stellar-sdk';
import { server, stellarConfig } from '../config/stellar';

export async function loadAccount(publicKey: string) {
  try {
    return await server.loadAccount(publicKey);
  } catch (error) {
    throw new Error(`Failed to load account ${publicKey}: ${error}`);
  }
}

export async function submitTransaction(transaction: Transaction): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  try {
    return await server.submitTransaction(transaction);
  } catch (error: any) {
    if (error.response?.data?.extras) {
      throw new Error(JSON.stringify(error.response.data.extras));
    }
    throw error;
  }
}

export function createMemo(memoText?: string): Memo<MemoType> | undefined {
  if (!memoText) return undefined;
  return Memo.text(memoText);
}

export function createAsset(code?: string, issuer?: string): Asset {
  if (!code || code === 'XLM') {
    return Asset.native();
  }
  return new Asset(code, issuer!);
}