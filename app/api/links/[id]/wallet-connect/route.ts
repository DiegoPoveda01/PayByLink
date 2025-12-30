import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkId = params.id;
    const { wallet_address } = await request.json();

    if (!linkId || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing linkId or wallet_address' },
        { status: 400 }
      );
    }

    // Registrar conexión de wallet
    const { error } = await supabase
      .from('wallet_connections')
      .insert({
        link_id: linkId,
        wallet_address: wallet_address,
      });

    if (error) {
      console.error('Error recording wallet connection:', error);
      return NextResponse.json(
        { error: 'Failed to record wallet connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
