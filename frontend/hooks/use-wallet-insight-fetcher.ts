import { getCookie } from "cookies-next";
import { useState, useCallback } from "react";
import type {WalletData} from "@/types/wallet.types";

export function useWalletInsightFetcher(input: string, isTxid: boolean) {
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWalletInsights = useCallback(
        async (type: 'wallet' | 'wallettx') => {
            if (!input) return;

            // Only proceed if isTxid is false (meaning it's a wallet address)
            if (isTxid) return;

            setLoading(true);
            setError(null);

            try {
                const token = getCookie("token") || localStorage.getItem("token");

                switch (type) {
                    case "wallet":
                        const walletResponse = await fetch(`/api/wallet?address=${input}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!walletResponse.ok) {
                            const errorData = await walletResponse.json();
                            throw new Error(errorData.detail || "Failed to fetch wallet data");
                        }

                        const data = await walletResponse.json();
                        // This log confirmed 145 data for the wallet TYPE, which is not the issue
                        // console.log("useWalletInsightFetcher - wallet type data:", data);

                        setWalletData(data);
                        break;


                }
            } catch (err) {
                console.error("Error in useWalletInsightFetcher:", err); // Log the error
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        },
        [input, isTxid]
    );

    return {
        walletData,
        loading,
        error,
        fetchWalletInsights,
    };
}
