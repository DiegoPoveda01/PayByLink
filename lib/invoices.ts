import { nanoid } from 'nanoid';
import { supabase } from './supabase';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceConfig {
  invoiceNumber?: string;
  recipientAddress: string;
  currency: 'USDC' | 'XLM';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // Percentage (e.g., 19 for 19%)
  taxAmount: number;
  total: number;
  notes?: string;
  dueDate: number; // timestamp
  ownerEmail: string;
  ownerName?: string;
  ownerBusinessName?: string;
  clientName?: string;
  clientEmail?: string;
}

export interface Invoice extends InvoiceConfig {
  id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: number;
  paidAt?: number;
  txHash?: string;
}

/**
 * Crear nueva factura
 */
export async function createInvoice(
  config: InvoiceConfig
): Promise<{ success: boolean; id?: string; invoiceNumber?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  try {
    const id = nanoid(12);
    const invoiceNumber = config.invoiceNumber || generateInvoiceNumber();

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        id,
        invoice_number: invoiceNumber,
        recipient_address: config.recipientAddress,
        currency: config.currency,
        items: config.items,
        subtotal: config.subtotal,
        tax_rate: config.taxRate,
        tax_amount: config.taxAmount,
        total: config.total,
        notes: config.notes || null,
        due_date: config.dueDate,
        owner_email: config.ownerEmail,
        owner_name: config.ownerName || null,
        owner_business_name: config.ownerBusinessName || null,
        client_name: config.clientName || null,
        client_email: config.clientEmail || null,
        status: 'draft',
        created_at: Date.now(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id, invoiceNumber };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Generar número de factura único
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = nanoid(6).toUpperCase();
  
  return `INV-${year}${month}-${random}`;
}

/**
 * Calcular totales de factura
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxRate: number
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Obtener facturas del usuario
 */
export async function getUserInvoices(ownerEmail: string): Promise<Invoice[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('owner_email', ownerEmail)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      recipientAddress: inv.recipient_address,
      currency: inv.currency,
      items: inv.items,
      subtotal: Number(inv.subtotal),
      taxRate: Number(inv.tax_rate),
      taxAmount: Number(inv.tax_amount),
      total: Number(inv.total),
      notes: inv.notes,
      dueDate: inv.due_date,
      ownerEmail: inv.owner_email,
      ownerName: inv.owner_name,
      ownerBusinessName: inv.owner_business_name,
      clientName: inv.client_name,
      clientEmail: inv.client_email,
      status: inv.status,
      createdAt: inv.created_at,
      paidAt: inv.paid_at,
      txHash: inv.tx_hash,
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

/**
 * Obtener factura por ID
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      recipientAddress: data.recipient_address,
      currency: data.currency,
      items: data.items,
      subtotal: Number(data.subtotal),
      taxRate: Number(data.tax_rate),
      taxAmount: Number(data.tax_amount),
      total: Number(data.total),
      notes: data.notes,
      dueDate: data.due_date,
      ownerEmail: data.owner_email,
      ownerName: data.owner_name,
      ownerBusinessName: data.owner_business_name,
      clientName: data.client_name,
      clientEmail: data.client_email,
      status: data.status,
      createdAt: data.created_at,
      paidAt: data.paid_at,
      txHash: data.tx_hash,
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

/**
 * Actualizar estado de factura
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  txHash?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.paid_at = Date.now();
      if (txHash) updateData.tx_hash = txHash;
    }

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    return !error;
  } catch (error) {
    console.error('Error updating invoice:', error);
    return false;
  }
}

/**
 * Generar HTML para PDF de factura
 */
export function generateInvoiceHTML(invoice: Invoice): string {
  const itemsHTML = invoice.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.unitPrice.toFixed(2)} ${invoice.currency}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${item.amount.toFixed(2)} ${invoice.currency}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #0891b2; }
    .invoice-number { font-size: 18px; color: #64748b; }
    .info-section { margin-bottom: 30px; }
    .info-label { font-weight: 600; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f1f5f9; padding: 12px 8px; text-align: left; font-weight: 600; }
    .totals { margin-top: 20px; text-align: right; }
    .totals-row { display: flex; justify-content: flex-end; padding: 8px 0; }
    .totals-label { width: 150px; text-align: right; padding-right: 20px; }
    .totals-value { width: 150px; text-align: right; font-weight: 600; }
    .total { font-size: 20px; color: #0891b2; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">FACTURA</div>
      <div class="invoice-number">${invoice.invoiceNumber}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 18px; font-weight: 600;">${invoice.ownerBusinessName || invoice.ownerName || 'PayByLink'}</div>
      <div style="color: #64748b;">${invoice.ownerEmail}</div>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
    <div class="info-section">
      <div class="info-label">Para:</div>
      <div style="font-size: 16px; font-weight: 600;">${invoice.clientName || 'Cliente'}</div>
      <div style="color: #64748b;">${invoice.clientEmail || ''}</div>
    </div>
    <div class="info-section" style="text-align: right;">
      <div class="info-label">Fecha de emisión:</div>
      <div>${new Date(invoice.createdAt).toLocaleDateString('es-ES')}</div>
      <div class="info-label" style="margin-top: 10px;">Fecha de vencimiento:</div>
      <div>${new Date(invoice.dueDate).toLocaleDateString('es-ES')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align: center;">Cantidad</th>
        <th style="text-align: right;">Precio Unitario</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <div class="totals-label">Subtotal:</div>
      <div class="totals-value">${invoice.subtotal.toFixed(2)} ${invoice.currency}</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">Impuesto (${invoice.taxRate}%):</div>
      <div class="totals-value">${invoice.taxAmount.toFixed(2)} ${invoice.currency}</div>
    </div>
    <div class="totals-row total">
      <div class="totals-label">TOTAL:</div>
      <div class="totals-value">${invoice.total.toFixed(2)} ${invoice.currency}</div>
    </div>
  </div>

  ${invoice.notes ? `
  <div style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #0891b2;">
    <div class="info-label">Notas:</div>
    <div>${invoice.notes}</div>
  </div>
  ` : ''}

  <div class="footer">
    <div>Gracias por su negocio</div>
    <div style="margin-top: 5px;">Powered by PayByLink - Stellar Payments</div>
  </div>
</body>
</html>
  `;
}

/**
 * Verificar facturas vencidas y actualizar estado
 */
export async function updateOverdueInvoices(): Promise<number> {
  if (!supabase) return 0;

  try {
    const now = Date.now();
    
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('status', 'sent')
      .lt('due_date', now)
      .select();

    return data?.length || 0;
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    return 0;
  }
}
