import { getBearerTokenFromHeaders } from '@/lib/auth';
import { NextResponse } from 'next/server';

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
    try {
        const token = await getBearerTokenFromHeaders();

        const response = await fetch(
            // TODO: Fetch from db the task-origin-trace-a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d-62ade3f9

            `${NEXT_PUBLIC_BACKEND_URL}/trace-tx-origin/status/...`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { detail: data.detail || 'Failed to fetch node information' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Node info fetch error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}
