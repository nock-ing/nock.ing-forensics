import {getBearerTokenFromHeaders} from "@/lib/auth";
import {NextResponse} from "next/server";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {


    try {

        const token = await getBearerTokenFromHeaders();

        const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });


        if (!response.ok) {

            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { detail: 'Authentication failed. Please log in.' },
                    { status: response.status }
                );
            }
            return NextResponse.json(
                { detail: 'Failed to fetch transactions' },
                { status: response.status }
            );
        }

        let data = await response.json();
        return NextResponse.json(data);


    } catch (error: unknown) {
        console.error("Transaction creation error: ", error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}