import { supabase } from './supabase';
import { nanoid } from 'nanoid';

export interface RecurringPaymentConfig {
  recipientAddress: string;
  amount: number;
  currency: 'USDC' | 'XLM';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: number; // timestamp
  endDate?: number; // optional end date
  ownerEmail: string;
}

export interface RecurringPayment {
  id: string;
  recipientAddress: string;
  amount: number;
  currency: 'USDC' | 'XLM';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: number;
  endDate?: number;
  nextPaymentDate: number;
  lastPaymentDate?: number;
  totalPayments: number;
  successfulPayments: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  ownerEmail: string;
  createdAt: number;
}

/**
 * Crear configuración de pago recurrente
 */
export async function createRecurringPayment(
  config: RecurringPaymentConfig
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  try {
    const id = nanoid(12);
    const nextPaymentDate = calculateNextPaymentDate(
      config.startDate,
      config.frequency
    );

    const { data, error } = await supabase
      .from('recurring_payments')
      .insert({
        id,
        recipient_address: config.recipientAddress,
        amount: config.amount,
        currency: config.currency,
        description: config.description,
        frequency: config.frequency,
        start_date: config.startDate,
        end_date: config.endDate || null,
        next_payment_date: nextPaymentDate,
        total_payments: 0,
        successful_payments: 0,
        status: 'active',
        owner_email: config.ownerEmail,
        created_at: Date.now(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Calcular próxima fecha de pago
 */
export function calculateNextPaymentDate(
  fromDate: number,
  frequency: 'daily' | 'weekly' | 'monthly'
): number {
  const date = new Date(fromDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  
  return date.getTime();
}

/**
 * Obtener pagos recurrentes del usuario
 */
export async function getUserRecurringPayments(
  ownerEmail: string
): Promise<RecurringPayment[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('owner_email', ownerEmail)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      recipientAddress: r.recipient_address,
      amount: Number(r.amount),
      currency: r.currency,
      description: r.description,
      frequency: r.frequency,
      startDate: r.start_date,
      endDate: r.end_date,
      nextPaymentDate: r.next_payment_date,
      lastPaymentDate: r.last_payment_date,
      totalPayments: r.total_payments,
      successfulPayments: r.successful_payments,
      status: r.status,
      ownerEmail: r.owner_email,
      createdAt: r.created_at,
    }));
  } catch (error) {
    console.error('Error fetching recurring payments:', error);
    return [];
  }
}

/**
 * Obtener pagos recurrentes pendientes
 */
export async function getPendingRecurringPayments(): Promise<RecurringPayment[]> {
  if (!supabase) return [];

  try {
    const now = Date.now();
    
    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('status', 'active')
      .lte('next_payment_date', now);

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      recipientAddress: r.recipient_address,
      amount: Number(r.amount),
      currency: r.currency,
      description: r.description,
      frequency: r.frequency,
      startDate: r.start_date,
      endDate: r.end_date,
      nextPaymentDate: r.next_payment_date,
      lastPaymentDate: r.last_payment_date,
      totalPayments: r.total_payments,
      successfulPayments: r.successful_payments,
      status: r.status,
      ownerEmail: r.owner_email,
      createdAt: r.created_at,
    }));
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return [];
  }
}

/**
 * Registrar ejecución de pago recurrente
 */
export async function recordRecurringPaymentExecution(
  recurringId: string,
  success: boolean,
  txHash?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Get current recurring payment
    const { data: recurring, error: fetchError } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('id', recurringId)
      .single();

    if (fetchError || !recurring) return false;

    const nextPaymentDate = calculateNextPaymentDate(
      Date.now(),
      recurring.frequency
    );

    // Update recurring payment
    const updateData: any = {
      total_payments: recurring.total_payments + 1,
      last_payment_date: Date.now(),
      next_payment_date: nextPaymentDate,
    };

    if (success) {
      updateData.successful_payments = recurring.successful_payments + 1;
    }

    // Check if should complete
    if (recurring.end_date && nextPaymentDate > recurring.end_date) {
      updateData.status = 'completed';
    }

    const { error: updateError } = await supabase
      .from('recurring_payments')
      .update(updateData)
      .eq('id', recurringId);

    if (updateError) return false;

    // Log execution
    await supabase.from('recurring_payment_executions').insert({
      recurring_id: recurringId,
      executed_at: Date.now(),
      success,
      tx_hash: txHash || null,
    });

    return true;
  } catch (error) {
    console.error('Error recording execution:', error);
    return false;
  }
}

/**
 * Pausar/reanudar pago recurrente
 */
export async function toggleRecurringPayment(
  recurringId: string,
  pause: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('recurring_payments')
      .update({ status: pause ? 'paused' : 'active' })
      .eq('id', recurringId);

    return !error;
  } catch (error) {
    console.error('Error toggling recurring payment:', error);
    return false;
  }
}

/**
 * Cancelar pago recurrente
 */
export async function cancelRecurringPayment(recurringId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('recurring_payments')
      .update({ status: 'cancelled' })
      .eq('id', recurringId);

    return !error;
  } catch (error) {
    console.error('Error cancelling recurring payment:', error);
    return false;
  }
}
