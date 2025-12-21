import { NextRequest, NextResponse } from 'next/server';
import { recordLinkView } from '@/lib/analytics';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      request.ip ||
                      undefined;

    // Registrar view
    await recordLinkView(id, userAgent, ipAddress);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record view',
      },
      { status: 500 }
    );
  }
}
