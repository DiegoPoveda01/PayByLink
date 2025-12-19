import { NextRequest, NextResponse } from 'next/server';
import {
  generateLinkId,
  createSlug,
  generatePaymentUrl,
  calculateExpirationTime,
  validateLinkConfig,
  type PaymentLinkConfig,
  type StoredPaymentLink,
} from '@/lib/payment-links';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

async function persistLink(data: StoredPaymentLink) {
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }

  const { error } = await supabase.from('payment_links').insert({
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    recipient: data.recipient,
    created_at: data.createdAt,
    expires_at: data.expiresAt,
    used: data.used,
    tx_hash: data.txHash ?? null,
    metadata: data.metadata ?? null,
  });

  if (error) {
    throw new Error(`Supabase insert error: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado en el servidor' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const config: PaymentLinkConfig = body;

    // Validar configuración
    const validation = validateLinkConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Generar ID y slug
    const linkId = generateLinkId();
    const slug = createSlug(
      config.description,
      config.amount,
      config.currency
    );

    // Calcular expiración (default 24 horas)
    const expiresIn = config.expiresIn || 1440;
    const expiresAt = calculateExpirationTime(expiresIn);

    // Crear objeto de almacenamiento
    const storedLink: StoredPaymentLink = {
      id: linkId,
      amount: config.amount,
      currency: config.currency,
      description: config.description,
      recipient: config.recipientAddress,
      createdAt: Date.now(),
      expiresAt,
      used: false,
      metadata: config.metadata,
    };

    // Guardar en Supabase
    await persistLink(storedLink);

    // Generar URL completa
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const url = generatePaymentUrl(linkId, slug, baseUrl);

    // Generar QR code
    let qrCode: string | null = null;
    try {
      qrCode = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        id: linkId,
        url,
        qrCode,
        expiresAt: new Date(expiresAt).toISOString(),
        expiresInMinutes: expiresIn,
      },
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payment link',
      },
      { status: 500 }
    );
  }
}
