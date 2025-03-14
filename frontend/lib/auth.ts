import { headers } from 'next/headers';

export async function getBearerTokenFromHeaders(): Promise<string | null> {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.split('Bearer ')[1];
}
