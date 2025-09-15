import { supabase } from '../config/supabase';
import { TransactionRecord } from '../types';

export class SupabaseProvider {
  static async createTransactionRecord(record: TransactionRecord): Promise<TransactionRecord> {
    const { data, error } = await supabase
      .from('stellar_transactions')
      .insert([record])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction record: ${error.message}`);
    }

    return data;
  }

  static async updateTransactionRecord(
    id: string,
    updates: Partial<TransactionRecord>
  ): Promise<TransactionRecord> {
    const { data, error } = await supabase
      .from('stellar_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update transaction record: ${error.message}`);
    }

    return data;
  }

  static async getTransactionByHash(hash: string): Promise<TransactionRecord | null> {
    const { data, error } = await supabase
      .from('stellar_transactions')
      .select('*')
      .eq('transaction_hash', hash)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }

    return data;
  }

  static async getTransactionsByAccount(accountId: string): Promise<TransactionRecord[]> {
    const { data, error } = await supabase
      .from('stellar_transactions')
      .select('*')
      .or(`source_account.eq.${accountId},destination_account.eq.${accountId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return data || [];
  }
}