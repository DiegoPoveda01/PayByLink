import { NextRequest, NextResponse } from 'next/server';
import { getDeviceBreakdown, getHourlyPattern, getConversionFunnel } from '@/lib/analytics';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const linkId = params.id;
    if (!linkId) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    const [device, hourly, funnel] = await Promise.all([
      getDeviceBreakdown(linkId),
      getHourlyPattern(linkId),
      getConversionFunnel(linkId),
    ]);

    return NextResponse.json({ success: true, data: { device, hourly, funnel } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
