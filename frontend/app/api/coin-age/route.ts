import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const txid = searchParams.get('hashid');

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { detail: 'Invalid or missing authorization token' },
                { status: 401 }
            );
        }

        const url = `${NEXT_PUBLIC_BACKEND_URL}/coin-age/txid?hashid=${txid}`;

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
        console.error('Coin age fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch coin age' },
            { status: 500 }
        );
    }
}