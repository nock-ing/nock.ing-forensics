import { cookies } from "next/headers";
import {NextResponse} from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST() {
    try {

        const url = `${BACKEND_URL}/logout`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
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