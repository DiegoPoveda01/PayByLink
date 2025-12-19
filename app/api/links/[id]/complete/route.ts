import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { type StoredPaymentLink } from '@/lib/payment-links';

// Simulador local
const localStore = new Map<string, StoredPaymentLink>();

async function getLink(id: string): Promise<StoredPaymentLink | null> {
  if (process.env.KV_REST_API_URL) {
    const data = await kv.get<string>(`link:${id}`);
    return data ? JSON.parse(data) : null;
  } else {
    return localStore.get(`link:${id}`) || null;
  }
}

async function updateLink(id: string, data: StoredPaymentLink) {
  if (process.env.KV_REST_API_URL) {
    // Mantener el mismo TTL
    const ttl = Math.floor((data.expiresAt - Date.now()) / 1000);
    await kv.set(`link:${id}`, JSON.stringify(data), { ex: Math.max(ttl, 60) });
  } else {
    localStore.set(`link:${id}`, data);
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
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
