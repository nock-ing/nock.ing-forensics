import { getBearerTokenFromHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const token = await getBearerTokenFromHeaders();
    
    if (!token) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const skip = url.searchParams.get('skip') || '0';
    const limit = url.searchParams.get('limit') || '100';

    const response = await fetch(
      `${BACKEND_URL}/wallet-monitoring/transactions?skip=${skip}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || 'Failed to fetch transactions' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}