import { NextRequest, NextResponse } from 'next/server';
import { getUserDashboard } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const stats = await getUserDashboard(email);

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'No data found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
