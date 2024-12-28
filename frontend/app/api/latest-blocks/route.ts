import { NextResponse } from "next/server";
import {headers} from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';


export async function GET() {
    try {
        const headersList = await headers();
        const token = headersList.get('authorization');

        if (!token) {
            return NextResponse.json(
                { detail: 'No authorization token provided' },
                { status: 401 }
            );
        }

        const response = await fetch(`${BACKEND_URL}/latest-blocks`, {
            headers: {
                'Authorization': token,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { detail: data.detail || 'Failed to fetch latest block' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Latest block fetch error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}