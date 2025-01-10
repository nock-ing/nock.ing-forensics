import { cookies } from "next/headers";
import {NextResponse} from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { detail: "No authorization token provided" },
                { status: 401 }
            )
        }

        const url = `${BACKEND_URL}/users/me`;

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
        console.error('Failed to fetch user information', error);
        return NextResponse.json(
            { error: 'Failed to fetch user information' },
            { status: 500 }
        );
    }
}