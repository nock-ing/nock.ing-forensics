import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import {TransactionId} from "@/types/transactionId.types";

export function useRecentTxids() {
    const [recentTxids, setRecentTxids] = useState<TransactionId[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRecentTxids() {
            try {
                setLoading(true);
                setError(null);
                const token = getCookie("token");
                const response = await fetch(`/api/recent-txids`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch recent txids");
                }

                const data: TransactionId[] = await response.json();
                setRecentTxids(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchRecentTxids();
    }, []);

    return { recentTxids, loading, error };
}