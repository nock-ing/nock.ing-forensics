import { getCookie } from "cookies-next";
import { useState, useCallback } from "react";
import type {WalletData, WalletTxData} from "@/types/wallet.types";

export function useWalletInsightFetcher(input: string, isTxid: boolean) {
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [walletTransactions, setWalletTransactions] = useState<WalletTxData>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWalletInsights = useCallback(
        async (type: 'wallet' | 'wallettx') => {
            if (!input) return;

            console.log("wallet address:" + input);
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

                        if (!walletResponse.ok) throw new Error("Failed to fetch wallet data");

                        const data = await walletResponse.json();
                        setWalletData(data);
                        break;

                    case "wallettx":
                        const walletTxResponse = await fetch(`/api/wallet-tx?address=${input}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!walletTxResponse.ok) throw new Error("Failed to fetch wallet transactions");

                        const txData = await walletTxResponse.json();
                        setWalletTransactions(txData);
                        break;

                    default:
                        throw new Error("Invalid fetch type");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        },
        [input, isTxid]
    );

    return {
        walletData,
        walletTransactions,
        loading,
        error,
        fetchWalletInsights,
    };
}