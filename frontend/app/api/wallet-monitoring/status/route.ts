import { NextResponse } from 'next/server';
import { getBearerTokenFromHeaders } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
    try {
        const token = await getBearerTokenFromHeaders();
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/wallet-monitoring/status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to get monitoring status:', error);
        return NextResponse.json(
            { error: 'Failed to get monitoring status' },
            { status: 500 }
        );
    }
}