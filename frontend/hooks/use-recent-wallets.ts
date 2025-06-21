// hooks/use-recent-wallets.ts
import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import {RecentWallet} from "@/types/wallet.types";

export function useRecentWallets() {
    const [recentWallets, setRecentWallets] = useState<RecentWallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRecentWallets() {
            try {
                setLoading(true);
                setError(null);
                const token = getCookie("token");
                const response = await fetch(`/api/recent-wallets`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch recent wallets");
                }

                const data: RecentWallet[] = await response.json();
                setRecentWallets(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchRecentWallets();
    }, []);

    return { recentWallets, loading, error };
}