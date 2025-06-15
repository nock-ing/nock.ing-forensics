import {getBearerTokenFromHeaders} from "@/lib/auth";
import {NextResponse} from "next/server";


const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';


export async function POST(req: Request) {
  try {
    const token = await getBearerTokenFromHeaders();
    const transactionData = await req.json();
    const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });

    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle non-JSON response safely
      const text = await response.text();
      data = { detail: text || 'Unknown error' };
    }

    if (!response.ok) {
      // Handle specific auth errors with a clearer message
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { detail: 'Authentication failed. Please log in.' },
          { status: response.status }
        );
      }
      return NextResponse.json(
        { detail: data.detail || 'Failed to add transaction' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Transaction creation error: ", error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}