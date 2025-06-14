import { getBearerTokenFromHeaders } from '@/lib/auth';
import { NextResponse } from 'next/server';

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// GET single transaction by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getBearerTokenFromHeaders();
        const { id } = await params;

        const response = await fetch(
            `${NEXT_PUBLIC_BACKEND_URL}/transactions/hash/${id}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { detail: text || 'Unknown error' };
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { detail: 'Authentication failed. Please log in.' },
                    { status: response.status }
                );
            }
            return NextResponse.json(
                { detail: data.detail || 'Failed to fetch transaction' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Transaction fetch error: ", error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT/PATCH to update a transaction
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getBearerTokenFromHeaders();
        const { id } = await params;
        const transactionData = await request.json();

        const response = await fetch(
            `${NEXT_PUBLIC_BACKEND_URL}/transactions/${id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(transactionData),
            }
        );

        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { detail: text || 'Unknown error' };
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { detail: 'Authentication failed. Please log in.' },
                    { status: response.status }
                );
            }
            return NextResponse.json(
                { detail: data.detail || 'Failed to update transaction' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Transaction update error: ", error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE a transaction
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getBearerTokenFromHeaders();
        const { id } = await params;

        const response = await fetch(
            `${NEXT_PUBLIC_BACKEND_URL}/transactions/${id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const contentType = response.headers.get('content-type') || '';
            let data;

            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { detail: text || 'Unknown error' };
            }

            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { detail: 'Authentication failed. Please log in.' },
                    { status: response.status }
                );
            }
            return NextResponse.json(
                { detail: data.detail || 'Failed to delete transaction' },
                { status: response.status }
            );
        }

        return NextResponse.json({ message: 'Transaction deleted successfully' });
    } catch (error: unknown) {
        console.error("Transaction deletion error: ", error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}