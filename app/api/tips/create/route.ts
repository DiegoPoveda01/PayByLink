import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

interface CreateTipBody {
  recipientAddress: string;
  currency: 'USDC' | 'XLM';
  description: string;
  suggestedAmounts?: number[];
  expiresIn?: number; // minutes
  ownerEmail?: string | null;
}

function isValidStellarAddress(addr: string) {
  return /^G[A-Z0-9]{55}$/.test(addr);
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase no está configurado en el servidor' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreateTipBody;
    const {
      recipientAddress,
      currency,
      description,
      suggestedAmounts = [2, 5, 10, 20],
      expiresIn = 10080, // 7 días
      ownerEmail = null,
    } = body;

    // Validaciones básicas
    const errors: string[] = [];
    if (!description || description.trim().length === 0) {
      errors.push('La descripción es requerida');
    }
    if (description && description.length > 100) {
      errors.push('La descripción no puede exceder 100 caracteres');
    }
    if (!recipientAddress || !isValidStellarAddress(recipientAddress)) {
      errors.push('Dirección Stellar inválida');
    }
    if (!['USDC', 'XLM'].includes(currency)) {
      errors.push('Moneda inválida');
    }
    if (expiresIn < 5 || expiresIn > 43200) {
      errors.push('El tiempo de expiración debe estar entre 5 minutos y 30 días');
    }
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const id = nanoid(8);
    const createdAt = Date.now();
    const expiresAt = createdAt + expiresIn * 60 * 1000;

    const { error } = await supabase.from('payment_links').insert({
      id,
      amount: null,
      currency,
      description,
      recipient: recipientAddress,
      created_at: createdAt,
      expires_at: expiresAt,
      used: false,
      tx_hash: null,
      metadata: { suggestedAmounts },
      owner_email: ownerEmail,
      type: 'tip',
    });

    if (error) {
      return NextResponse.json(
        { success: false, errors: ['Supabase insert error: ' + error.message] },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const url = `${baseUrl}/tip/${id}`;

    let qrCode: string | null = null;
    try {
      qrCode = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (err) {
      // Ignorar errores de QR
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        url,
        qrCode,
        expiresAt: new Date(expiresAt).toISOString(),
        expiresInMinutes: expiresIn,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create tip link' },
      { status: 500 }
    );
  }
}
