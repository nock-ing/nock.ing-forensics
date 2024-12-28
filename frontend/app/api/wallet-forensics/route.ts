import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { wallet_address } = await req.json();
        const token = req.headers.get('authorization');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const response = await fetch(`${process.env.BACKEND_URL}/wallet-forensics`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ wallet_address }),
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Wallet forensics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wallet forensics' },
            { status: 500 }
        );
    }
} 