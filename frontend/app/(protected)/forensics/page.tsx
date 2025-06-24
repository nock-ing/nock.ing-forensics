"use client"

import {useSearchParams, useRouter} from "next/navigation"
import {useEffect, useState, useRef} from "react"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import CoinAge from "@/components/CoinAge"
import RelatedTransactions from "@/components/RelatedTransactions/RelatedTransactions"
import BitcoinPrevTxChart from "@/components/BitcoinPrevTxChart/BitcoinPrevTxChart"
import TransactionInfo from "@/components/TransactionInfo/TransactionInfo"
import WalletAddressFromTxid from "@/components/WalletAddressFromTxId/WalletAddressFromTxid"
import Link from "next/link";
import {useTxInsightFetcher} from "@/hooks/use-tx-insight-fetcher";
import {useWalletInsightFetcher} from "@/hooks/use-wallet-insight-fetcher";
import {WalletTransactionsDisplay} from "@/components/WalletTransactionsDisplay";
import WalletInfo from "@/components/WalletInfo/WalletInfo";
import WalletActivityHeatmap from "@/components/WalletActivityHeatmap/WalletActivityHeatmap";


export default function ForensicsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const input = searchParams.get("input");
    const isTxid = searchParams.get("isTxid") === "true";

    const [newInput, setNewInput] = useState(input || "")

    const {
        coinAgeData,
        relatedTxData,
        transaction,
        mempoolTx,
        wallet,
        loading,
        error,
        fetchTxInsights,
    } = useTxInsightFetcher(input || "", isTxid);

    const {
        walletData,
        loading: walletLoading,
        error: walletError,
        tooManyTransactions,
        fetchWalletInsights,
    } = useWalletInsightFetcher(input || "", isTxid);

    // Track what has been fetched to prevent duplicate requests
    const fetchedRef = useRef({
        input: "",
        isTxid: false,
        walletFetched: false,
        txFetched: false
    });

    useEffect(() => {
        if (!input) return;

        const currentKey = `${input}-${isTxid}`;
        const lastKey = `${fetchedRef.current.input}-${fetchedRef.current.isTxid}`;

        // Only fetch if input/type changed
        if (currentKey === lastKey) return;

        // Update tracking
        fetchedRef.current = {
            input,
            isTxid,
            walletFetched: false,
            txFetched: false
        };

        if (isTxid && !fetchedRef.current.txFetched) {
            fetchedRef.current.txFetched = true;
            fetchTxInsights("coinAge");
            fetchTxInsights("relatedTx");
            fetchTxInsights("transaction");
            fetchTxInsights("wallet");
            fetchTxInsights("mempool");
        } else if (!isTxid && !fetchedRef.current.walletFetched) {
            fetchedRef.current.walletFetched = true;
            fetchWalletInsights("wallet");
        }
    }, [input, isTxid, fetchTxInsights, fetchWalletInsights]);

    // Separate effect for wallet transactions - only runs when wallet data is loaded
    useEffect(() => {
        if (!input || isTxid || !walletData || tooManyTransactions) return;
        
        if (fetchedRef.current.input === input && fetchedRef.current.walletFetched) {
            return;
        }

        fetchWalletInsights("wallettx");
    }, [walletData, tooManyTransactions, input, isTxid, fetchWalletInsights]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Reset fetch tracking when user submits new input
        fetchedRef.current = {
            input: "",
            isTxid: false,
            walletFetched: false,
            txFetched: false
        };
        
        // A simple check: most transaction IDs are 64-character hex strings.
        const isTxid = /^[0-9a-fA-F]{64}$/.test(newInput);
        router.push(`/forensics?input=${newInput}&isTxid=${isTxid}`);
    }


    return (
        <div className="p-4 space-y-6 w-full">
            <h1 className="text-2xl font-bold mb-4">Forensic Analysis</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={newInput}
                        onChange={(e) => setNewInput(e.target.value)}
                        placeholder="Enter transaction ID"
                        className="flex-1"
                    />
                    <Button type="submit">Analyze</Button>
                </div>
            </form>

            {input && isTxid && (
                <>
                    <div className={"mt-4 flex justify-between items-center"}>
                        <WalletAddressFromTxid txid={wallet?.txid} scriptpubkey_address={wallet?.scriptpubkey_address}/>

                        <div className={"space-x-4"}>
                            <Link href={`/investigation?txid=${input}`}>
                                <Button>
                                    Start Investigation
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <TransactionInfo input={input} transaction={transaction} mempoolTransaction={mempoolTx}/>
                </>
            )}

            {isTxid && (
                <>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Coin Age Analysis (from Txid)</h2>
                        {loading && (
                            <div className="space-y-2">
                                <div className="h-8 bg-muted animate-pulse rounded"/>
                                <div className="h-24 bg-muted animate-pulse rounded"/>
                                <div className="h-8 bg-muted animate-pulse rounded"/>
                            </div>
                        )}
                        {error && <p className="text-destructive">{error}</p>}
                        {coinAgeData && <CoinAge {...coinAgeData} />}
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Related Transactions</h2>
                        {loading && (
                            <div className="space-y-2">
                                <div className="h-8 bg-muted animate-pulse rounded"/>
                                <div className="h-24 bg-muted animate-pulse rounded"/>
                                <div className="h-8 bg-muted animate-pulse rounded"/>
                            </div>
                        )}
                        {error && <p className="text-destructive">{error}</p>}
                        {relatedTxData && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <BitcoinPrevTxChart {...relatedTxData} />
                                </div>
                                <div>
                                    <RelatedTransactions {...relatedTxData} />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!isTxid && tooManyTransactions && (
                <div className="p-6 border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 rounded-lg">
                    <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
                        Too Many Transactions
                    </h2>
                    <p className="text-amber-700 dark:text-amber-300">
                        This wallet has over 1,500 transactions. More support will be added soon to handle wallets with high transaction volumes.
                    </p>
                </div>
            )}

            {!isTxid && walletData && !tooManyTransactions && (
                <>
                    <div>
                        <WalletInfo walletData={walletData} walletError={walletError} walletLoading={walletLoading}
                                    walletTransactions={walletData}/>
                    </div>
                    <div className={"px-6"}>
                        <WalletActivityHeatmap
                            transactions={walletData?.transactions?.map((tx) => ({
                                ...tx,
                                // Make sure each transaction has a timestamp property in ISO format
                                timestamp: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : new Date().toISOString()
                            })) || []}
                            className="mt-6"
                        />
                    </div>
                    <div>
                        <WalletTransactionsDisplay data={walletData}/>
                    </div>
                </>
            )}
        </div>
    )
}