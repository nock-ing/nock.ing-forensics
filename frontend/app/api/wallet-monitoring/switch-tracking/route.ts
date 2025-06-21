import { NextRequest, NextResponse } from 'next/server';
import { getBearerTokenFromHeaders } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
    try {
        const token = await getBearerTokenFromHeaders();
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const response = await fetch(`${BACKEND_URL}/wallet-monitoring/switch-tracking-address`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to switch tracking:', error);
        return NextResponse.json(
            { error: 'Failed to switch tracking' },
            { status: 500 }
        );
    }
}