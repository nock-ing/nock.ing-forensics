import { useState, useEffect } from 'react';
import {getCookie} from "cookies-next";
import {HistoricalPrice} from "@/types/historicalPrice.types";

export function useHistoricalPrices(timestamp?: string) {
    const [priceData, setPriceData] = useState<HistoricalPrice>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPriceData = async () => {
            if (!timestamp) return;

            setError(null);
            setIsLoading(true);
            try {
                const token = getCookie("token") || localStorage.getItem("token");

                const response: Response = await fetch(`/api/historical-price?timestamp=${timestamp}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                if (!response.ok) {
                    throw new Error('Failed to fetch price data');
                }
                const data = await response.json();
                setPriceData(data);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setError(err);
                console.error('Error fetching price data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPriceData();
    }, [timestamp]);

    return { priceData, isLoading, error };
}