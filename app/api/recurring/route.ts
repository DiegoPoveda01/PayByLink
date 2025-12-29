import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createRecurringPayment,
  getUserRecurringPayments,
  toggleRecurringPayment,
  cancelRecurringPayment,
} from '@/lib/recurring-payments';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    const items = await getUserRecurringPayments(email);
    return NextResponse.json({ success: true, data: items || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientAddress, amount, currency, description, frequency, startDate, endDate, ownerEmail } = body;
    if (!recipientAddress || !amount || !currency || !frequency || !startDate) {
      return NextResponse.json({ success: false, error: 'missing fields' }, { status: 400 });
    }
    const created = await createRecurringPayment({
      recipientAddress,
      amount,
      currency,
      description,
      frequency,
      startDate,
      endDate,
      ownerEmail,
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'pause' | 'resume' | 'cancel'
    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action required' }, { status: 400 });
    }
    if (action === 'pause') await toggleRecurringPayment(id, false);
    else if (action === 'resume') await toggleRecurringPayment(id, true);
    else if (action === 'cancel') await cancelRecurringPayment(id);
    else return NextResponse.json({ success: false, error: 'invalid action' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
