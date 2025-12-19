import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { isLinkExpired, type StoredPaymentLink } from '@/lib/payment-links';

// Simulador local para desarrollo
const localStore = new Map<string, StoredPaymentLink>();

async function getLink(id: string): Promise<StoredPaymentLink | null> {
  if (process.env.KV_REST_API_URL) {
    // Usar Vercel KV si está configurado
    const data = await kv.get<string>(`link:${id}`);
    return data ? JSON.parse(data) : null;
  } else {
    // Fallback a almacenamiento local
    return localStore.get(`link:${id}`) || null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
