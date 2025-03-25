// hooks/useCoinAge.ts
import { useState, useEffect } from 'react';
import {CoinAgeResponse} from "@/types/coinAgeData.types";
import {getCookie} from "cookies-next";

export function useCoinAge(address: string | undefined) {
    const [coinAgeData, setCoinAgeData] = useState<CoinAgeResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCoinAge() {
            if (!address) return;
            const token = getCookie('token');

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/coin-age-wallet?address=${address}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                    );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to fetch coin age data');
                }

                const data = await response.json();
                setCoinAgeData(data);
            } catch (err) {
                console.error('Error fetching coin age:', err);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setError(err.message || 'Failed to fetch coin age data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchCoinAge();
    }, [address]);

    return { coinAgeData, isLoading, error };
}