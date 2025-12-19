import { nanoid } from 'nanoid';

/**
 * Interfaz para configurar un enlace de pago
 */
export interface PaymentLinkConfig {
  amount: number;
  currency: 'USDC' | 'XLM';
  description: string;
  recipientAddress: string;
  expiresIn?: number; // En minutos, default 1440 (24h)
  metadata?: Record<string, string>;
}

/**
 * Datos almacenados de un enlace de pago
 */
export interface StoredPaymentLink {
  id: string;
  amount: number;
  currency: 'USDC' | 'XLM';
  description: string;
  recipient: string;
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  used: boolean;
  txHash?: string;
  metadata?: Record<string, any>;
}

/**
 * Generar ID único para el enlace
 */
export function generateLinkId(): string {
  return nanoid(8); // 8 caracteres aleatorios
}

/**
 * Crear slug URL-friendly desde descripción
 */
export function createSlug(description: string, amount: number, currency: string): string {
  // Limpiar y formatear descripción
  const cleaned = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .substring(0, 50); // Limitar longitud

  return `${amount}${currency.toLowerCase()}-${cleaned}`;
}

/**
 * Generar URL completa del enlace de pago
 */
export function generatePaymentUrl(
  linkId: string,
  slug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
): string {
  return `${baseUrl}/pay/${linkId}/${slug}`;
}

/**
 * Calcular timestamp de expiración
 */
export function calculateExpirationTime(minutesFromNow: number): number {
  return Date.now() + minutesFromNow * 60 * 1000;
}

/**
 * Verificar si un enlace ha expirado
 */
export function isLinkExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Formatear tiempo restante hasta expiración
 */
export function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return 'Expirado';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Validar configuración de enlace
 */
export function validateLinkConfig(config: PaymentLinkConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar monto
  if (config.amount <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }
  if (config.amount > 10000) {
    errors.push('El monto no puede exceder 10,000');
  }

  // Validar descripción
  if (!config.description || config.description.trim().length === 0) {
    errors.push('La descripción es requerida');
  }
  if (config.description.length > 100) {
    errors.push('La descripción no puede exceder 100 caracteres');
  }

  // Validar dirección Stellar
  const addressRegex = /^G[A-Z0-9]{55}$/;
  if (!addressRegex.test(config.recipientAddress)) {
    errors.push('Dirección Stellar inválida');
  }

  // Validar tiempo de expiración
  if (config.expiresIn !== undefined) {
    if (config.expiresIn < 5) {
      errors.push('El tiempo de expiración mínimo es 5 minutos');
    }
    if (config.expiresIn > 43200) {
      // 30 días
      errors.push('El tiempo de expiración máximo es 30 días');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
