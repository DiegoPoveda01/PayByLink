import {
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';
import { server, STELLAR_CONFIG, SupportedAsset } from './config';

/**
 * Parámetros para Path Payment (multi-currency)
 */
export interface PathPaymentParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  sendAssetCode: SupportedAsset; // Lo que el pagador envía
  destAssetCode: SupportedAsset; // Lo que el receptor quiere recibir
  destAmount: string; // Monto que DEBE recibir el destinatario
  maxSlippage?: number; // % máximo de slippage (default 5%)
  memo?: string;
}

/**
 * Construir transacción de Path Payment
 * Permite pagar en una moneda y recibir en otra automáticamente
 */
export async function buildPathPaymentTransaction({
  sourcePublicKey,
  destinationPublicKey,
  sendAssetCode,
  destAssetCode,
  destAmount,
  maxSlippage = 5,
  memo,
}: PathPaymentParams): Promise<string> {
  try {
    // 1. Cargar cuenta origen
    const sourceAccount = await server.loadAccount(sourcePublicKey);

    // 2. Determinar assets
    const sendAsset = sendAssetCode === 'XLM'
      ? Asset.native()
      : new Asset(
          STELLAR_CONFIG.assets[sendAssetCode].code,
          STELLAR_CONFIG.assets[sendAssetCode].issuer!
        );

    const destAsset = destAssetCode === 'XLM'
      ? Asset.native()
      : new Asset(
          STELLAR_CONFIG.assets[destAssetCode].code,
          STELLAR_CONFIG.assets[destAssetCode].issuer!
        );

    // 3. Calcular sendMax con slippage
    const destAmountNum = parseFloat(destAmount);
    const sendMax = (destAmountNum * (1 + maxSlippage / 100)).toFixed(7);

    // 4. Construir transacción
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: STELLAR_CONFIG.baseFee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.pathPaymentStrictReceive({
          sendAsset: sendAsset,
          sendMax: sendMax,
          destination: destinationPublicKey,
          destAsset: destAsset,
          destAmount: destAmount,
        })
      )
      .setTimeout(300);

    // 5. Agregar memo si existe
    if (memo && memo.length > 0) {
      transaction.addMemo(Memo.text(memo.substring(0, 28)));
    }

    // 6. Construir y retornar XDR
    const builtTransaction = transaction.build();
    return builtTransaction.toXDR();
  } catch (error) {
    console.error('Error building path payment:', error);
    throw new Error('Failed to build path payment transaction');
  }
}

/**
 * Obtener path óptimo entre dos assets
 * Retorna la mejor ruta de conversión
 */
export async function findPaymentPath({
  sourceAssetCode,
  destAssetCode,
  destAmount,
  sourcePublicKey,
}: {
  sourceAssetCode: SupportedAsset;
  destAssetCode: SupportedAsset;
  destAmount: string;
  sourcePublicKey: string;
}): Promise<{
  sourceAmount: string;
  path: Asset[];
  available: boolean;
} | null> {
  try {
    const sourceAsset = sourceAssetCode === 'XLM'
      ? Asset.native()
      : new Asset(
          STELLAR_CONFIG.assets[sourceAssetCode].code,
          STELLAR_CONFIG.assets[sourceAssetCode].issuer!
        );

    const destAsset = destAssetCode === 'XLM'
      ? Asset.native()
      : new Asset(
          STELLAR_CONFIG.assets[destAssetCode].code,
          STELLAR_CONFIG.assets[destAssetCode].issuer!
        );

    // Buscar paths disponibles
    const pathsResponse = await server
      .strictReceivePaths(sourcePublicKey, sourceAsset, destAmount)
      .call();

    if (pathsResponse.records.length === 0) {
      return { sourceAmount: '0', path: [], available: false };
    }

    // Tomar el mejor path (primer resultado)
    const bestPath = pathsResponse.records[0];

    return {
      sourceAmount: bestPath.source_amount,
      path: bestPath.path.map((asset: any) =>
        asset.asset_type === 'native'
          ? Asset.native()
          : new Asset(asset.asset_code, asset.asset_issuer)
      ),
      available: true,
    };
  } catch (error) {
    console.error('Error finding payment path:', error);
    return null;
  }
}
