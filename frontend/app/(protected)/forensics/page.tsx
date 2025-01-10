'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CoinAge from '@/components/CoinAge';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RelatedTransactionsProps } from "@/components/RelatedTransactions/relatedTransactions.types";
import RelatedTransactions from "@/components/RelatedTransactions/RelatedTransactions";
import BitcoinPrevTxChart from "@/components/BitcoinPrevTxChart/BitcoinPrevTxChart";
import {getCookie} from "cookies-next";

interface CoinAgeData {
    hashid: string;
    coin_creation_block: number;
    current_block: number;
    age_in_blocks: number;
    age_in_days: number;
}

export default function ForensicsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const input = searchParams.get('input');
    const isTxid = searchParams.get('isTxid') === 'true';
    const [coinAgeData, setCoinAgeData] = useState<CoinAgeData | null>(null);
    const [relatedTxData, setRelatedTxData] = useState<RelatedTransactionsProps | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newInput, setNewInput] = useState(input || '');

    useEffect(() => {
        async function fetchCoinAge() {
            if (!input || !isTxid) return;

            setLoading(true);
            setError(null);
            try {
                const token = getCookie('token');
                const response = await fetch(`/api/coin-age?hashid=${input}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch coin age data');
                }

                const data = await response.json();
                setCoinAgeData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        async function fetchRelatedTx() {
            if (!input || !isTxid) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/transaction-forensics?txid=${input}&depth=5`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch related transaction data');
                }

                const data = await response.json();
                setRelatedTxData(data);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchCoinAge();
        fetchRelatedTx();
    }, [input, isTxid]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/forensics?input=${newInput}&isTxid=true`);
    };

    console.log('transactions', relatedTxData?.related_transactions);
    return (
        <div className="p-4 space-y-6">
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

            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Input</p>
                <p className="font-mono bg-muted p-2 rounded-md">{input}</p>
                <p className="text-sm text-muted-foreground">Type</p>
                <p>{isTxid ? 'Transaction ID' : 'Wallet Address'}</p>
            </div>

            {isTxid && (
                <>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Coin Age Analysis</h2>
                        {loading && (
                            <div className="space-y-2">
                                <div className="h-8 bg-muted animate-pulse rounded"/>
                                <div className="h-24 bg-muted animate-pulse rounded"/>
                                <div className="h-8 bg-muted animate-pulse rounded"/>
                            </div>
                        )}
                        {error && (
                            <p className="text-destructive">{error}</p>
                        )}
                        {coinAgeData && (
                            <CoinAge {...coinAgeData} />
                        )}
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
                        {error && (
                            <p className="text-destructive">{error}</p>
                        )}
                        {relatedTxData && (
                            <div className={"flex"}>
                                <RelatedTransactions {...relatedTxData} />
                                <BitcoinPrevTxChart {...relatedTxData} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

