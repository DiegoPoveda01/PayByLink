import {
  isConnected,
  getPublicKey,
  signTransaction,
  isAllowed,
  setAllowed,
} from '@stellar/freighter-api';
import { TransactionBuilder } from '@stellar/stellar-sdk';
import { server, STELLAR_CONFIG } from '../stellar/config';

/**
 * Errores de Freighter
 */
export enum FreighterError {
  NOT_INSTALLED = 'FREIGHTER_NOT_INSTALLED',
  NOT_ALLOWED = 'FREIGHTER_NOT_ALLOWED',
  USER_DECLINED = 'FREIGHTER_USER_DECLINED',
  UNKNOWN = 'FREIGHTER_UNKNOWN_ERROR',
}

/**
 * Verificar si Freighter está instalado
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    return await isConnected();
  } catch {
    return false;
  }
}

/**
 * Conectar wallet Freighter
 * Retorna la clave pública del usuario
 */
export async function connectFreighterWallet(): Promise<string> {
  // 1. Verificar que Freighter está instalado
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(FreighterError.NOT_INSTALLED);
  }

  // 2. Verificar permisos
  const allowed = await isAllowed();
  if (!allowed) {
    // Solicitar permisos
    await setAllowed();
  }

  // 3. Obtener clave pública
  try {
    const publicKey = await getPublicKey();
    return publicKey;
  } catch (error) {
    console.error('Error connecting Freighter:', error);
    throw new Error(FreighterError.NOT_ALLOWED);
  }
}

/**
 * Firmar y enviar transacción usando Freighter
 */
export async function signAndSubmitTransaction(
  xdr: string
): Promise<{
  hash: string;
  ledger: number;
  successful: boolean;
}> {
  try {
    // 1. Firmar transacción con Freighter
    const signedXdr = await signTransaction(xdr, {
      network: STELLAR_CONFIG.networkPassphrase,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    });

    // 2. Reconstruir transacción firmada
    const transaction = TransactionBuilder.fromXDR(
      signedXdr,
      STELLAR_CONFIG.networkPassphrase
    );

    // 3. Enviar a Stellar network
    const result = await server.submitTransaction(transaction);

    return {
      hash: result.hash,
      ledger: result.ledger,
      successful: result.successful,
    };
  } catch (error: any) {
    console.error('Error signing/submitting transaction:', error);
    
    // Manejar rechazo del usuario
    if (error.message?.includes('User declined')) {
      throw new Error(FreighterError.USER_DECLINED);
    }
    
    throw new Error(FreighterError.UNKNOWN);
  }
}

/**
 * Desconectar wallet (opcional, Freighter no tiene método oficial)
 */
export function disconnectWallet(): void {
  // Freighter no tiene API para desconectar
  // Solo limpiamos estado local si es necesario
  console.log('Wallet disconnected');
}
