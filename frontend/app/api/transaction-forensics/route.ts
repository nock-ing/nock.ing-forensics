import { log } from 'console';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const txid = searchParams.get('txid');
        const depth = searchParams.get('depth');
        const token = req.headers.get('authorization');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const url = `${process.env.BACKEND_URL}/transaction-forensics?txid=${txid}&depth=${depth}`;
        console.log('url', url);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': token,
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