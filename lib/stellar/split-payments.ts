import {
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';
import { server, STELLAR_CONFIG, SupportedAsset } from './config';

/**
 * Destinatario en un split payment
 */
export interface SplitRecipient {
  address: string;
  percentage?: number; // Porcentaje (0-100)
  amount?: string; // O monto fijo
  description: string;
}

/**
 * Parámetros para Split Payment
 */
export interface SplitPaymentParams {
  sourcePublicKey: string;
  recipients: SplitRecipient[];
  totalAmount: string;
  assetCode: SupportedAsset;
  memo?: string;
}

/**
 * Construir transacción de Split Payment
 * Un pago que se divide automáticamente entre múltiples destinatarios
 */
export async function buildSplitPaymentTransaction({
  sourcePublicKey,
  recipients,
  totalAmount,
  assetCode,
  memo,
}: SplitPaymentParams): Promise<string> {
  try {
    // 1. Validar que los porcentajes sumen 100%
    const totalPercentage = recipients.reduce(
      (sum, r) => sum + (r.percentage || 0),
      0
    );

    if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Los porcentajes deben sumar 100%');
    }

    // 2. Cargar cuenta origen
    const sourceAccount = await server.loadAccount(sourcePublicKey);

    // 3. Determinar asset
    const asset = assetCode === 'XLM'
      ? Asset.native()
      : new Asset(
          STELLAR_CONFIG.assets[assetCode].code,
          STELLAR_CONFIG.assets[assetCode].issuer!
        );

    // 4. Construir transacción con múltiples operaciones
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
      fee: STELLAR_CONFIG.baseFee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    });

    // 5. Calcular y agregar cada pago
    const total = parseFloat(totalAmount);
    let distributedTotal = 0;

    recipients.forEach((recipient, index) => {
      let amount: string;

      if (recipient.amount) {
        // Monto fijo especificado
        amount = recipient.amount;
      } else if (recipient.percentage) {
        // Calcular desde porcentaje
        amount = ((total * recipient.percentage) / 100).toFixed(7);
      } else {
        throw new Error(`Recipient ${index} debe tener 'amount' o 'percentage'`);
      }

      distributedTotal += parseFloat(amount);

      // Agregar operación de pago
      transactionBuilder.addOperation(
        Operation.payment({
          destination: recipient.address,
          asset: asset,
          amount: amount,
        })
      );
    });

    // 6. Verificar que el total distribuido no exceda el monto total
    if (distributedTotal > total * 1.001) {
      // 0.1% margen por redondeo
      throw new Error(
        `Total distribuido (${distributedTotal}) excede el monto total (${total})`
      );
    }

    // 7. Agregar memo si existe
    if (memo && memo.length > 0) {
      transactionBuilder.addMemo(Memo.text(memo.substring(0, 28)));
    }

    // 8. Finalizar transacción
    transactionBuilder.setTimeout(300);
    const builtTransaction = transactionBuilder.build();

    return builtTransaction.toXDR();
  } catch (error) {
    console.error('Error building split payment:', error);
    throw new Error(
      `Failed to build split payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validar configuración de split payment
 */
export function validateSplitPayment(
  recipients: SplitRecipient[],
  totalAmount: string
): { valid: boolean; error?: string } {
  // Mínimo 2 destinatarios
  if (recipients.length < 2) {
    return { valid: false, error: 'Se requieren al menos 2 destinatarios' };
  }

  // Máximo 100 operaciones por transacción en Stellar
  if (recipients.length > 100) {
    return {
      valid: false,
      error: 'Máximo 100 destinatarios por transacción',
    };
  }

  // Validar direcciones Stellar
  for (const recipient of recipients) {
    if (!recipient.address.startsWith('G') || recipient.address.length !== 56) {
      return {
        valid: false,
        error: `Dirección inválida: ${recipient.address}`,
      };
    }
  }

  // Validar que todos tengan amount o percentage
  for (const recipient of recipients) {
    if (!recipient.amount && !recipient.percentage) {
      return {
        valid: false,
        error: 'Cada destinatario debe tener amount o percentage',
      };
    }
  }

  // Si usan porcentajes, validar que sumen 100
  const hasPercentages = recipients.some((r) => r.percentage !== undefined);
  if (hasPercentages) {
    const totalPercentage = recipients.reduce(
      (sum, r) => sum + (r.percentage || 0),
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return {
        valid: false,
        error: `Los porcentajes suman ${totalPercentage}%, deben sumar 100%`,
      };
    }
  }

  return { valid: true };
}
