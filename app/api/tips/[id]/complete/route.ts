import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    const { txHash, amount } = body;

    if (!txHash) {
      return NextResponse.json(
        { success: false, errors: ['Transaction hash required'] },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Update tip link as used
    const { error: updateError } = await supabase
      .from('payment_links')
      .update({
        used: true,
        tx_hash: txHash,
        completed_at: Date.now(),
        metadata: { amount },
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating tip:', updateError);
      return NextResponse.json(
        { success: false, errors: ['Failed to record tip'] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tip recorded successfully',
    });
  } catch (error) {
    console.error('Error completing tip:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}
