import { Networks } from '@stellar/stellar-sdk';
import { Horizon } from '@stellar/stellar-sdk';

/**
 * Configuración de red Stellar
 */
export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
    ? Networks.PUBLIC
    : Networks.TESTNET,
  
  horizonUrl: process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org',
  
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
    ? Networks.PUBLIC
    : Networks.TESTNET,

  /**
   * Assets soportados en la plataforma
   */
  assets: {
    USDC: {
      code: 'USDC',
      issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', // Circle USDC
      name: 'USD Coin',
      decimals: 7,
    },
    XLM: {
      code: 'XLM',
      issuer: null, // Native asset
      name: 'Stellar Lumens',
      decimals: 7,
    }
  },

  /**
   * Fees y límites
   */
  baseFee: '10000', // 0.001 XLM
  maxAmount: 10000, // Máximo por transacción
  minAmount: 0.01, // Mínimo por transacción
} as const;

/**
 * Cliente Horizon singleton
 */
export const server = new Horizon.Server(STELLAR_CONFIG.horizonUrl);

/**
 * Tipos para assets
 */
export type SupportedAsset = keyof typeof STELLAR_CONFIG.assets;

/**
 * Verificar si una dirección Stellar es válida
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(address);
}

/**
 * Formatear balance con decimales correctos
 */
export function formatBalance(amount: string | number, decimals: number = 7): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(decimals);
}

/**
 * Truncar dirección Stellar para display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
