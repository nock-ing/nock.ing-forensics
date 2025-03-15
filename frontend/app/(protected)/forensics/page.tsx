"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import CoinAge from "@/components/CoinAge"
import RelatedTransactions from "@/components/RelatedTransactions/RelatedTransactions"
import BitcoinPrevTxChart from "@/components/BitcoinPrevTxChart/BitcoinPrevTxChart"
import TransactionInfo from "@/components/TransactionInfo/TransactionInfo"
import WalletAddressFromTxid from "@/components/WalletAddressFromTxId/WalletAddressFromTxid"
import Link from "next/link";
import {useTxInsightFetcher} from "@/hooks/useTxInsightFetcher";


export default function ForensicsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const input = searchParams.get("input")
    const isTxid = searchParams.get("isTxid") === "true"

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

    useEffect(() => {
        if (!input || !isTxid) return;

        fetchTxInsights("coinAge");
        fetchTxInsights("relatedTx");
        fetchTxInsights("transaction");
        fetchTxInsights("wallet");
        fetchTxInsights("mempool");
    }, [fetchTxInsights, input, isTxid]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        router.push(`/forensics?input=${newInput}&isTxid=true`)
    }

    return (
        <div className="p-4 space-y-6 w-full">
            <h1 className="text-2xl font-bold mb-4">Forensics Analysis</h1>

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

            {input && (
                <>
                    <div className={"mt-4 flex justify-between items-center"}>
                        <WalletAddressFromTxid txid={wallet?.txid} scriptpubkey_address={wallet?.scriptpubkey_address} />

                        <div className={"space-x-4"}>
                            <Link href={`/investigation?txid=${input}`}>
                                <Button>
                                    Start Investigation
                                </Button>
                            </Link>
                            <Link href={"#"}>
                                <Button>
                                    Save
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <TransactionInfo isTxid={isTxid} input={input} transaction={transaction} mempoolTransaction={mempoolTx} />
                </>
            )}

            {isTxid && (
                <>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Coin Age Analysis (from Txid)</h2>
                        {loading && (
                            <div className="space-y-2">
                                <div className="h-8 bg-muted animate-pulse rounded" />
                                <div className="h-24 bg-muted animate-pulse rounded" />
                                <div className="h-8 bg-muted animate-pulse rounded" />
                            </div>
                        )}
                        {error && <p className="text-destructive">{error}</p>}
                        {coinAgeData && <CoinAge {...coinAgeData} />}
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Related Transactions</h2>
                        {loading && (
                            <div className="space-y-2">
                                <div className="h-8 bg-muted animate-pulse rounded" />
                                <div className="h-24 bg-muted animate-pulse rounded" />
                                <div className="h-8 bg-muted animate-pulse rounded" />
                            </div>
                        )}
                        {error && <p className="text-destructive">{error}</p>}
                        {relatedTxData && (
                            <div className="flex">
                                <RelatedTransactions {...relatedTxData} />
                                <BitcoinPrevTxChart {...relatedTxData} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
