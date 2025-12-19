import {
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Account,
} from '@stellar/stellar-sdk';
import { server, STELLAR_CONFIG, SupportedAsset } from './config';

/**
 * Parámetros para construir una transacción de pago
 */
export interface PaymentTxParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  assetCode: SupportedAsset;
  memo?: string;
}

/**
 * Resultado de una transacción
 */
export interface TransactionResult {
  hash: string;
  ledger: number;
  successful: boolean;
}

/**
 * Construir transacción de pago en Stellar
 * Retorna XDR para firmar en el cliente
 */
export async function buildPaymentTransaction({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  assetCode,
  memo,
}: PaymentTxParams): Promise<string> {
  try {
    // 1. Cargar cuenta origen desde Horizon
    const sourceAccount = await server.loadAccount(sourcePublicKey);

    // 2. Determinar el asset a enviar
    const asset = assetCode === 'XLM'
      ? Asset.native()
      : new Asset(
          STELLAR_CONFIG.assets[assetCode].code,
          STELLAR_CONFIG.assets[assetCode].issuer!
        );

    // 3. Construir la transacción
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: STELLAR_CONFIG.baseFee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: asset,
          amount: amount,
        })
      )
      .setTimeout(300); // 5 minutos para completar

    // 4. Agregar memo si existe
    if (memo && memo.length > 0) {
      const truncatedMemo = memo.substring(0, 28); // Max 28 bytes
      transaction.addMemo(Memo.text(truncatedMemo));
    }

    // 5. Construir y retornar XDR
    const builtTransaction = transaction.build();
    return builtTransaction.toXDR();
  } catch (error) {
    console.error('Error building transaction:', error);
    throw new Error('Failed to build transaction');
  }
}

/**
 * Verificar el estado de una transacción por hash
 */
export async function getTransactionStatus(hash: string): Promise<TransactionResult | null> {
  try {
    const transaction = await server.transactions().transaction(hash).call();
    
    return {
      hash: transaction.hash,
      ledger: transaction.ledger_attr,
      successful: transaction.successful,
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Verificar balance de una cuenta
 */
export async function getAccountBalance(
  publicKey: string,
  assetCode: SupportedAsset
): Promise<string | null> {
  try {
    const account = await server.loadAccount(publicKey);
    
    if (assetCode === 'XLM') {
      // Balance nativo
      const nativeBalance = account.balances.find(
        (balance) => balance.asset_type === 'native'
      );
      return nativeBalance ? nativeBalance.balance : '0';
    } else {
      // Balance de asset específico
      const assetConfig = STELLAR_CONFIG.assets[assetCode];
      const assetBalance = account.balances.find(
        (balance) =>
          balance.asset_type !== 'native' &&
          'asset_code' in balance &&
          balance.asset_code === assetConfig.code &&
          'asset_issuer' in balance &&
          balance.asset_issuer === assetConfig.issuer
      );
      return assetBalance && 'balance' in assetBalance ? assetBalance.balance : '0';
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}

/**
 * Verificar si una cuenta existe en Stellar
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch (error) {
    return false;
  }
}
