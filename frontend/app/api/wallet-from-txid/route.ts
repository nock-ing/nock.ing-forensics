import { NextRequest, NextResponse } from 'next/server';
import {cookies} from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const txid = searchParams.get('txid');
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const url = `${BACKEND_URL}/tx/wallet?txid=${txid}`;
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