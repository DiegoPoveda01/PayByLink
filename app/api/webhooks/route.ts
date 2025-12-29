import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createWebhook, toggleWebhook, deleteWebhook, getUserWebhooks } from '@/lib/webhooks';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    const hooks = await getUserWebhooks(email);
    return NextResponse.json({ success: true, data: hooks || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerEmail, url, events } = body;
    if (!ownerEmail || !url || !Array.isArray(events)) {
      return NextResponse.json({ success: false, error: 'ownerEmail, url, events required' }, { status: 400 });
    }
    const created = await createWebhook(ownerEmail, url, events);
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body;
    if (!id || active === undefined) {
      return NextResponse.json({ success: false, error: 'id and active required' }, { status: 400 });
    }
    await toggleWebhook(id, active);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    await deleteWebhook(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
