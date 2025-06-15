import { NextRequest, NextResponse } from 'next/server';
import {getBearerTokenFromHeaders} from "@/lib/auth";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const txid = searchParams.get('txid');
        const token = await getBearerTokenFromHeaders();

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!txid || txid === '[object Object]' || txid === 'undefined') {
            return NextResponse.json(
                { error: 'Invalid or missing txid parameter' },
                { status: 400 }
            );
        }


        const url = `${NEXT_PUBLIC_BACKEND_URL}/tx/wallet?txid=${txid}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Transaction forensics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction forensics' },
            { status: 500 }
        );
    }
}