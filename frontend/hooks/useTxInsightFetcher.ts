import { getCookie } from "cookies-next";
import { useState, useCallback } from "react";
import type { CoinAgeData } from "@/types/coinAgeData.types";
import type { RelatedTransactionsProps } from "@/components/RelatedTransactions/relatedTransactions.types";
import type { TransactionDetailsProps } from "@/types/transactions.types";
import type { WalletAddressFromTxId } from "@/components/WalletAddressFromTxId/walletAddressFromTxId.types";

export function useTxInsightFetcher(input: string, isTxid: boolean) {
    const [coinAgeData, setCoinAgeData] = useState<CoinAgeData | null>(null);
    const [relatedTxData, setRelatedTxData] = useState<RelatedTransactionsProps | null>(null);
    const [transaction, setTransaction] = useState<TransactionDetailsProps>();
    const [mempoolTx, setMempoolTx] = useState<TransactionDetailsProps>();
    const [wallet, setWallet] = useState<WalletAddressFromTxId>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTxInsights = useCallback(async (type: "coinAge" | "relatedTx" | "transaction" | "wallet" | "mempool") => {
        if (!input || !isTxid) return;

        setLoading(true);
        setError(null);

        try {
            const token = getCookie("token") || localStorage.getItem("token");
            let response: Response;

            switch (type) {
                case "coinAge":
                    response = await fetch(`/api/coin-age?hashid=${input}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) throw new Error("Failed to fetch coin age data");
                    setCoinAgeData(await response.json());
                    break;

                case "relatedTx":
                    response = await fetch(`/api/related-tx?txid=${input}&depth=5`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) throw new Error("Failed to fetch related transaction data");
                    setRelatedTxData(await response.json());
                    break;

                case "transaction":
                    response = await fetch(`/api/tx-info?txid=${input}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) throw new Error("Failed to fetch transaction data");
                    setTransaction(await response.json());
                    break;

                case "wallet":
                    response = await fetch(`/api/wallet-from-txid?txid=${input}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) throw new Error("Failed to fetch wallet from txid");
                    setWallet(await response.json());
                    break;

                case "mempool":
                    response = await fetch(`/api/mempool-tx?txid=${input}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) throw new Error("Failed to fetch mempool transaction");
                    setMempoolTx(await response.json());
                    break;

                default:
                    throw new Error("Invalid fetch type");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [input, isTxid]); // <== Memoize based on input/isTxid

    return {
        coinAgeData,
        relatedTxData,
        transaction,
        mempoolTx,
        wallet,
        loading,
        error,
        fetchTxInsights,
    };
}
