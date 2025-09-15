import { Keypair, Operation, Asset, Memo, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { server } from '../../config/stellar';
import { OperationRepository } from '../repository/operation.repository';

interface BuildPaymentInput {
  sourcePublicKey: string;
  destination: string;
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  memoText?: string;
}

interface ExecutePaymentInput extends Omit<BuildPaymentInput, 'sourcePublicKey'> {
  userId: string;
  secretKey: string;
}

export class StellarService {
  /**
   * Gera um novo par de chaves Stellar (pública e secreta).
   * Esta operação não interage com a rede.
   */
  static generateStellarKeypair(): { publicKey: string; secret: string } {
    const pair = Keypair.random();
    return {
      publicKey: pair.publicKey(),
      secret: pair.secret(),
    };
  }

  /**
   * Cria uma nova conta na Testnet da Stellar e a financia usando o Friendbot.
   */
  static async createTestAccount(): Promise<{ publicKey: string; secret: string }> {
    const { publicKey, secret } = this.generateStellarKeypair();

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error('Failed to fund account using Friendbot.');
      }
      await response.json();
    } catch (e) {
      console.error("FRIENDBOT ERROR: ", e);
      throw new Error('Could not connect to Friendbot.');
    }

    return { publicKey, secret };
  }
    static async buildPaymentXdr(input: BuildPaymentInput): Promise<string> {
        try {
            const { sourcePublicKey, destination, amount, assetCode, assetIssuer, memoText } = input;

            const sourceAccount = await server.loadAccount(sourcePublicKey);

            let asset: Asset;
            if (assetCode && assetIssuer) {
                asset = new Asset(assetCode, assetIssuer);
            } else {
                asset = Asset.native(); 
            }

            let transactionBuilder = new TransactionBuilder(sourceAccount, {
                fee: '10000',
                networkPassphrase: Networks.TESTNET
            });

            transactionBuilder = transactionBuilder.addOperation(
                Operation.payment({
                    destination: destination,
                    asset: asset,
                    amount: amount
                })
            );

            if (memoText) {
                transactionBuilder = transactionBuilder.addMemo(Memo.text(memoText));
            }

            const transaction = transactionBuilder.setTimeout(300).build();

            return transaction.toXDR();

        } catch (error) {
            console.error('Error building payment XDR:', error);
            throw new Error(`Failed to build payment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async executePayment(input: ExecutePaymentInput): Promise<{ success: boolean; hash?: string; error?: string }> {
        let operationId: string | undefined;
        
        try {
            const { userId, secretKey, destination, amount, assetCode, assetIssuer, memoText } = input;

            const operationData = {
                user_id: userId,
                type: 'PAYMENT',
                status: 'PENDING',
                amount: parseFloat(amount),
                asset_code: assetCode || 'XLM',
                destination_key: destination,
                context: memoText ? `Memo: ${memoText}` : undefined
            };

            const operation = await OperationRepository.create(operationData);
            operationId = operation.id;

            const sourceKeypair = Keypair.fromSecret(secretKey);
            const sourcePublicKey = sourceKeypair.publicKey();

            const sourceAccount = await server.loadAccount(sourcePublicKey);

            let asset: Asset;
            if (assetCode && assetIssuer) {
                asset = new Asset(assetCode, assetIssuer);
            } else {
                asset = Asset.native();
            }

            let transactionBuilder = new TransactionBuilder(sourceAccount, {
                fee: '10000',
                networkPassphrase: Networks.TESTNET
            });

            transactionBuilder = transactionBuilder.addOperation(
                Operation.payment({
                    destination: destination,
                    asset: asset,
                    amount: amount
                })
            );

            if (memoText) {
                transactionBuilder = transactionBuilder.addMemo(Memo.text(memoText));
            }

            const transaction = transactionBuilder.setTimeout(300).build();

            transaction.sign(sourceKeypair);

            const result = await server.submitTransaction(transaction);

            await OperationRepository.update(operationId, {
                status: 'COMPLETED',
                stellar_transaction_hash: result.hash
            });

            return {
                success: true,
                hash: result.hash
            };

        } catch (error) {
            console.error('Error executing payment:', error);
            
            if (operationId) {
                try {
                    await OperationRepository.update(operationId, {
                        status: 'FAILED',
                        context: error instanceof Error ? error.message : 'Unknown error occurred'
                    });
                } catch (updateError) {
                    console.error('Error updating operation status to FAILED:', updateError);
                }
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}