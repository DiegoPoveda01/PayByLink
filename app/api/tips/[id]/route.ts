import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();

    // Get tip configuration from payment_links table
    const { data: tipLink, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .eq('type', 'tip')
      .single();

    if (error || !tipLink) {
      return NextResponse.json(
        { success: false, errors: ['Tip link not found'] },
        { status: 404 }
      );
    }

    // Check if expired
    if (Date.now() > tipLink.expires_at) {
      return NextResponse.json(
        { success: false, errors: ['Tip link has expired'] },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        recipient: tipLink.recipient,
        currency: tipLink.currency,
        description: tipLink.description,
        suggestedAmounts: tipLink.metadata?.suggestedAmounts || [2, 5, 10, 20],
      },
    });
  } catch (error) {
    console.error('Error fetching tip link:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}
