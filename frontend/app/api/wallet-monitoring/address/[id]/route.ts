import { NextRequest, NextResponse } from 'next/server';
import { getBearerTokenFromHeaders } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const token = await getBearerTokenFromHeaders();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/wallet-monitoring/address/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to stop monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to stop monitoring' },
      { status: 500 }
    );
  }
}