import {NextResponse} from "next/server";
import {cookies} from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { detail: 'No authorization token provided' },
                { status: 401 }
            );
        }
        const url = `${BACKEND_URL}/latest-blocks?count=7`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log(data);
        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Latest block fetch error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}