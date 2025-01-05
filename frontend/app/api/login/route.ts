import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

interface LoginFormData {
    username: string;
    password: string;
    grant_type?: string;
    scope?: string;
    client_id?: string;
    client_secret?: string;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const loginData: LoginFormData = {
            username: formData.get('username')?.toString() || '',
            password: formData.get('password')?.toString() || '',
        };

        const response = await fetch(`${BACKEND_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: loginData.username,
                password: loginData.password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { detail: data.detail || 'Login failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Login error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
} 