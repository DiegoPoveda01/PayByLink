import { supabase } from './supabase';
import crypto from 'crypto';

export interface WebhookConfig {
  url: string;
  events: ('payment.completed' | 'payment.failed' | 'link.viewed' | 'link.expired')[];
  secret: string;
  active: boolean;
}

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: {
    linkId: string;
    amount?: number;
    currency?: string;
    txHash?: string;
    [key: string]: any;
  };
}

/**
 * Generar firma HMAC para webhook
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Enviar evento a webhook configurado
 */
export async function sendWebhookEvent(
  ownerEmail: string,
  event: string,
  data: any
): Promise<void> {
  if (!supabase) return;

  try {
    // Get active webhooks for this user
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('owner_email', ownerEmail)
      .eq('active', true);

    if (error || !webhooks || webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data,
    };

    // Send to each configured webhook
    for (const webhook of webhooks) {
      if (!webhook.events.includes(event)) continue;

      const payloadString = JSON.stringify(payload);
      const signature = signWebhookPayload(payloadString, webhook.secret);

      // Queue webhook delivery
      await deliverWebhook(webhook.url, payload, signature, webhook.id);
    }
  } catch (error) {
    console.error('Error sending webhook event:', error);
  }
}

/**
 * Entregar webhook con reintentos
 */
async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  signature: string,
  webhookId: string,
  attempt: number = 1
): Promise<void> {
  const maxRetries = 3;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': payload.timestamp.toString(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok && attempt < maxRetries) {
      // Exponential backoff: 2^attempt seconds
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return deliverWebhook(url, payload, signature, webhookId, attempt + 1);
    }

    // Log delivery result
    if (supabase) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhookId,
        event: payload.event,
        status: response.ok ? 'success' : 'failed',
        status_code: response.status,
        attempts: attempt,
        delivered_at: Date.now(),
      });
    }
  } catch (error) {
    console.error('Webhook delivery error:', error);
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return deliverWebhook(url, payload, signature, webhookId, attempt + 1);
    }

    // Log failed delivery
    if (supabase) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhookId,
        event: payload.event,
        status: 'failed',
        attempts: attempt,
        error: String(error),
        delivered_at: Date.now(),
      });
    }
  }
}

/**
 * Crear nuevo webhook
 */
export async function createWebhook(
  ownerEmail: string,
  url: string,
  events: string[]
): Promise<{ success: boolean; secret?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  try {
    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        owner_email: ownerEmail,
        url,
        events,
        secret,
        active: true,
        created_at: Date.now(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, secret };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Obtener webhooks del usuario
 */
export async function getUserWebhooks(ownerEmail: string): Promise<any[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('id, url, events, active, created_at')
      .eq('owner_email', ownerEmail)
      .order('created_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return [];
  }
}

/**
 * Activar/desactivar webhook
 */
export async function toggleWebhook(
  webhookId: string,
  active: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('webhooks')
      .update({ active })
      .eq('id', webhookId);

    return !error;
  } catch (error) {
    console.error('Error toggling webhook:', error);
    return false;
  }
}

/**
 * Eliminar webhook
 */
export async function deleteWebhook(webhookId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId);

    return !error;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return false;
  }
}
