export interface TransactionRecord {
  id?: string;
  transaction_hash: string;
  source_account: string;
  destination_account?: string;
  operation_type: string;
  amount?: string;
  asset_code?: string;
  memo?: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
  created_at?: string;
  submitted_at?: string;
  ledger?: number;
  fee_charged?: string;
  result_xdr?: string;
}

export interface PaymentRequest {
  sourceSecret: string;
  destination: string;
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
}

export interface CreateAccountRequest {
  sourceSecret: string;
  destination: string;
  startingBalance: string;
}