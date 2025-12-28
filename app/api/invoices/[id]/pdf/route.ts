import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceById, generateInvoiceHTML } from '@/lib/invoices';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const invoice = await getInvoiceById(id);
    
    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const html = generateInvoiceHTML(invoice);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
