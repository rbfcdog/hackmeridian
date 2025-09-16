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

interface AssetInput {
  code: string;
  issuer: string;
}

interface BuildPathPaymentInput {
  sourcePublicKey: string;
  destination: string;
  destAsset: AssetInput;
  destAmount: string;
  sourceAsset: AssetInput;
}

interface ExecutePathPaymentInput extends Omit<BuildPathPaymentInput, 'sourcePublicKey'> {
  userId: string;
  secretKey: string;
}

export class StellarService {
  static generateStellarKeypair(): { publicKey: string; secret: string } {
    const pair = Keypair.random();
    return {
      publicKey: pair.publicKey(),
      secret: pair.secret(),
    };
  }

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

    private static async _executeTransaction(
        _userId: string,
        secretKey: string,
        unsignedXdr: string,
        operationData: any
    ): Promise<{ success: boolean; hash?: string; error?: string }> {
        let operationId: string | undefined;
        
        try {
            const operation = await OperationRepository.create(operationData);
            operationId = operation.id;

            
            const transaction = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET);

            const sourceKeypair = Keypair.fromSecret(secretKey);
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
            console.error('Error executing transaction:', error);
            
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

    static async executePayment(input: ExecutePaymentInput): Promise<{ success: boolean; hash?: string; error?: string }> {
        try {
            const { userId, secretKey, destination, amount, assetCode, assetIssuer, memoText } = input;

            const sourceKeypair = Keypair.fromSecret(secretKey);
            const sourcePublicKey = sourceKeypair.publicKey();

            const unsignedXdr = await StellarService.buildPaymentXdr({
                sourcePublicKey,
                destination,
                amount,
                assetCode,
                assetIssuer,
                memoText
            });

            const operationData = {
                user_id: userId,
                type: 'PAYMENT',
                status: 'PENDING',
                amount: parseFloat(amount),
                asset_code: assetCode || 'XLM',
                destination_key: destination,
                context: memoText ? `Memo: ${memoText}` : undefined
            };

            return await StellarService._executeTransaction(userId, secretKey, unsignedXdr, operationData);

        } catch (error) {
            console.error('Error in executePayment:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    static async buildPathPaymentXdr(input: BuildPathPaymentInput): Promise<string> {
        try {
            const { sourcePublicKey, destination, destAsset, destAmount, sourceAsset } = input;

            const destAssetObj = new Asset(destAsset.code, destAsset.issuer);
            const sourceAssetObj = new Asset(sourceAsset.code, sourceAsset.issuer);

            const pathsResponse = await server.strictReceivePaths(
                [sourceAssetObj],
                destAssetObj,
                destAmount
            ).call();

            if (!pathsResponse.records || pathsResponse.records.length === 0) {
                throw new Error('Não foi encontrado um caminho de conversão entre os ativos.');
            }

            let bestPath = pathsResponse.records[0];
            for (const path of pathsResponse.records) {
                if (parseFloat(path.source_amount) < parseFloat(bestPath.source_amount)) {
                    bestPath = path;
                }
            }

            const sourceAccount = await server.loadAccount(sourcePublicKey);

            const pathAssets = bestPath.path.map((pathAsset: any) => {
                if (pathAsset.asset_type === 'native') {
                    return Asset.native();
                } else {
                    return new Asset(pathAsset.asset_code, pathAsset.asset_issuer);
                }
            });

            const transactionBuilder = new TransactionBuilder(sourceAccount, {
                fee: '10000',
                networkPassphrase: Networks.TESTNET
            });

            transactionBuilder.addOperation(
                Operation.pathPaymentStrictReceive({
                    sendAsset: sourceAssetObj,
                    sendMax: bestPath.source_amount,
                    destination: destination,
                    destAsset: destAssetObj,
                    destAmount: destAmount,
                    path: pathAssets
                })
            );

            const transaction = transactionBuilder.setTimeout(300).build();

            return transaction.toXDR();

        } catch (error) {
            console.error('Error building path payment XDR:', error);
            throw new Error(`Failed to build path payment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async executePathPayment(input: ExecutePathPaymentInput): Promise<{ success: boolean; hash?: string; error?: string }> {
        try {
            const { userId, secretKey, destination, destAsset, destAmount, sourceAsset } = input;

            const sourceKeypair = Keypair.fromSecret(secretKey);
            const sourcePublicKey = sourceKeypair.publicKey();

            const unsignedXdr = await StellarService.buildPathPaymentXdr({
                sourcePublicKey,
                destination,
                destAsset,
                destAmount,
                sourceAsset
            });

            const operationData = {
                user_id: userId,
                type: 'PATH_PAYMENT',
                status: 'PENDING',
                amount: parseFloat(destAmount),
                asset_code: destAsset.code,
                destination_key: destination,
                context: JSON.stringify({
                    sourceAsset,
                    destAsset,
                    destAmount,
                    destination
                })
            };

            return await StellarService._executeTransaction(userId, secretKey, unsignedXdr, operationData);

        } catch (error) {
            console.error('Error in executePathPayment:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    static async getAccountBalance(publicKey: string): Promise<any[]> {
        try {
            const account = await server.loadAccount(publicKey);
            
            const formattedBalances = account.balances.map(balance => ({
                balance: balance.balance,
                asset_type: balance.asset_type,
                asset_code: (balance as any).asset_code,
                asset_issuer: (balance as any).asset_issuer,
            }));

            return formattedBalances;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Conta com a chave pública ${publicKey} não encontrada na rede Stellar.`);
            }
            console.error(`Erro ao buscar saldo para a conta ${publicKey}:`, error);
            throw new Error('Falha ao consultar o saldo na rede Stellar.');
        }
    }
}