import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { User } from '@/components/SideBar/sidebar.types';

export function useUser() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const token = getCookie('token');

    useEffect(() => {
        const checkAuthAndFetchUser = async () => {

            if (!token) {
                router.push('/');
                return;
            }

            try {
                const response = await fetch(`/api/users-me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUser(data);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetchUser();
    }, [router]);

    const signOut = async () => {
        try {
            console.log(token);
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            setUser(null);
            if (!response.ok) {
                throw new Error('Failed to sign out');
            }

            router.push('/');
        } catch (err) {
            console.error('Error signing out:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return { user, loading, error, signOut };
}

