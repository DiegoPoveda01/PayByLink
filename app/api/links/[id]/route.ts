import { NextRequest, NextResponse } from 'next/server';
import { isLinkExpired, type StoredPaymentLink } from '@/lib/payment-links';
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
  };
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    // Obtener enlace del almacenamiento
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

    // Verificar si expiró
    const expired = isLinkExpired(link.expiresAt);

    // Retornar datos (sin información sensible si es necesario)
    return NextResponse.json({
      success: true,
      data: {
        amount: link.amount,
        currency: link.currency,
        description: link.description,
        recipient: link.recipient,
        expired,
        used: link.used,
        expiresAt: new Date(link.expiresAt).toISOString(),
        createdAt: new Date(link.createdAt).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching payment link:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment link',
      },
      { status: 500 }
    );
  }
}
