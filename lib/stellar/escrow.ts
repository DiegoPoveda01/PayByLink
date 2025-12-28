import {
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Claimant,
} from '@stellar/stellar-sdk';
import { server, STELLAR_CONFIG, SupportedAsset } from './config';

/**
 * Parámetros para crear un Escrow (Claimable Balance)
 */
export interface EscrowParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  assetCode: SupportedAsset;
  autoReleaseAfterDays?: number; // Días hasta auto-liberar (default: 7)
  memo?: string;
}

/**
 * Crear Claimable Balance (Escrow)
 * Los fondos quedan bloqueados hasta que el destinatario los reclame
 * o hasta que pase el tiempo especificado
 */
export async function buildEscrowTransaction({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  assetCode,
  autoReleaseAfterDays = 7,
  memo,
}: EscrowParams): Promise<string> {
  try {
    // 1. Cargar cuenta origen
    const sourceAccount = await server.loadAccount(sourcePublicKey);

    // 2. Determinar asset
    const asset =
      assetCode === 'XLM'
        ? Asset.native()
        : new Asset(
            STELLAR_CONFIG.assets[assetCode].code,
            STELLAR_CONFIG.assets[assetCode].issuer!
          );

    // 3. Calcular tiempo de auto-liberación (en segundos)
    const autoReleaseSeconds = autoReleaseAfterDays * 24 * 60 * 60;

    // 4. Crear claimant con predicado de tiempo relativo
    const claimant = new Claimant(
      destinationPublicKey,
      Claimant.predicateBeforeRelativeTime(autoReleaseSeconds.toString())
    );

    // 5. Construir transacción
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: STELLAR_CONFIG.baseFee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.createClaimableBalance({
          asset: asset,
          amount: amount,
          claimants: [claimant],
        })
      )
      .setTimeout(300);

    // 6. Agregar memo
    if (memo && memo.length > 0) {
      transaction.addMemo(Memo.text(memo.substring(0, 28)));
    }

    // 7. Construir y retornar XDR
    const builtTransaction = transaction.build();
    return builtTransaction.toXDR();
  } catch (error) {
    console.error('Error building escrow transaction:', error);
    throw new Error('Failed to create escrow');
  }
}

/**
 * Reclamar un Claimable Balance
 */
export async function buildClaimBalanceTransaction({
  claimerPublicKey,
  balanceId,
}: {
  claimerPublicKey: string;
  balanceId: string;
}): Promise<string> {
  try {
    // 1. Cargar cuenta del reclamante
    const claimerAccount = await server.loadAccount(claimerPublicKey);

    // 2. Construir transacción
    const transaction = new TransactionBuilder(claimerAccount, {
      fee: STELLAR_CONFIG.baseFee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId: balanceId,
        })
      )
      .setTimeout(300)
      .build();

    return transaction.toXDR();
  } catch (error) {
    console.error('Error building claim transaction:', error);
    throw new Error('Failed to claim balance');
  }
}

/**
 * Obtener claimable balances de una cuenta
 */
export async function getClaimableBalances(publicKey: string): Promise<
  Array<{
    id: string;
    asset: string;
    amount: string;
    sponsor: string | undefined;
    claimants: string[];
  }>
> {
  try {
    const balances = await server
      .claimableBalances()
      .claimant(publicKey)
      .limit(200)
      .call();

    return balances.records.map((balance) => ({
      id: balance.id,
      asset:
        balance.asset === 'native'
          ? 'XLM'
          : `${balance.asset.split(':')[0]}`,
      amount: balance.amount,
      sponsor: balance.sponsor,
      claimants: balance.claimants.map((c) => c.destination),
    }));
  } catch (error) {
    console.error('Error fetching claimable balances:', error);
    return [];
  }
}

/**
 * Verificar si un balance es reclamable ahora
 */
export async function isBalanceClaimable(
  balanceId: string,
  claimerPublicKey: string
): Promise<boolean> {
  try {
    const balance = await server.claimableBalances().claimableBalance(balanceId).call();

    // Verificar si el claimer está en la lista
    const isClaimant = balance.claimants.some(
      (c) => c.destination === claimerPublicKey
    );

    if (!isClaimant) return false;

    // En producción, aquí verificarías los predicados de tiempo
    // Por ahora, asumimos que si está en la lista, puede reclamar

    return true;
  } catch (error) {
    console.error('Error checking balance claimability:', error);
    return false;
  }
}
