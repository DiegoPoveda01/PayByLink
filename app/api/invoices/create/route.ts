import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { createInvoice, type InvoiceConfig } from '@/lib/invoices';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, errors: ['Debes iniciar sesión'] },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const config: InvoiceConfig = {
      ...body,
      ownerEmail: session.user.email,
    };

    const result = await createInvoice(config);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: [result.error] },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        invoiceNumber: result.invoiceNumber,
      },
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}
