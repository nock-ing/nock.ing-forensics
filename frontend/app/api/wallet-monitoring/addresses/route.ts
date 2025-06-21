import { getBearerTokenFromHeaders } from '@/lib/auth';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const token = await getBearerTokenFromHeaders();
    
    if (!token) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/wallet-monitoring/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || 'Failed to fetch addresses' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Fetch addresses error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}