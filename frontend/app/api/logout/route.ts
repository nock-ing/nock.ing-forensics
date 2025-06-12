import { cookies } from "next/headers";
import {NextResponse} from "next/server";
import {getBearerTokenFromHeaders} from "@/lib/auth";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST() {
    try {

        const token = getBearerTokenFromHeaders();

        const url = `${NEXT_PUBLIC_BACKEND_URL}/logout`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        (await cookies()).delete('token')
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to logout', error);
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        );
    }
}