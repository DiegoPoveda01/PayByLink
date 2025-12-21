import { NextRequest, NextResponse } from 'next/server';
import { type StoredPaymentLink } from '@/lib/payment-links';
import { supabase } from '@/lib/supabase';

async function getLink(id: string): Promise<StoredPaymentLink | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase get error:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    amount: Number(data.amount),
    currency: data.currency,
    description: data.description,
    recipient: data.recipient,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    used: data.used,
    txHash: data.tx_hash ?? undefined,
    metadata: data.metadata ?? undefined,
    ownerEmail: data.owner_email ?? undefined,
  };
}

async function updateLink(id: string, data: StoredPaymentLink) {
  if (!supabase) return;

  const { error } = await supabase
    .from('payment_links')
    .update({
      used: data.used,
      tx_hash: data.txHash ?? null,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Supabase update error: ${error.message}`);
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado en el servidor' },
        { status: 500 }
      );
    }

    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction hash is required',
        },
        { status: 400 }
      );
    }

    // Obtener enlace
    const link = await getLink(id);

    if (!link) {
      return NextResponse.json(
        {
          success: false,
          error: 'Link not found',
        },
        { status: 404 }
      );
    }

    // Marcar como usado y guardar hash
    link.used = true;
    link.txHash = txHash;

    // Actualizar en almacenamiento
    await updateLink(id, link);

    return NextResponse.json({
      success: true,
      message: 'Payment registered successfully',
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register payment',
      },
      { status: 500 }
    );
  }
}
