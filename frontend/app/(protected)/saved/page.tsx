'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletApi } from '@/hooks/useWalletApi';
import { useTransactionApi } from '@/hooks/useTransactionApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Wallet, Receipt, AlertTriangle, Calendar, Bitcoin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {WalletsInDB} from "@/types/wallet.types";
import {formatBTC} from "@/utils/formatters";

interface SavedTransaction {
    id: number;
    wallet_id: number;
    user_id: number;
    block_id: number;
    transaction_hash: string;
    timestamp: number;
    total_input: number;
    total_output: number;
    fee: number;
    suspicious_illegal_activity: boolean;
}

export default function SavedPage() {
    const router = useRouter();
    const { getWallets, getWalletsStatus } = useWalletApi();
    const { getAllTransactions, getAllTransactionsStatus } = useTransactionApi();
    
    const [wallets, setWallets] = useState<WalletsInDB[]>([]);
    const [transactions, setTransactions] = useState<SavedTransaction[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [walletsData, transactionsData] = await Promise.all([
                getWallets(),
                getAllTransactions()
            ]);
            
            if (walletsData) {
                setWallets(walletsData);
            }
            
            if (transactionsData) {
                setTransactions(transactionsData);
            }
        };

        fetchData();
    }, []);

    const handleWalletClick = (walletAddress: string) => {
        router.push(`/forensics?input=${encodeURIComponent(walletAddress)}&isTxid=false`);
    };

    const handleTransactionClick = (transactionHash: string) => {
        router.push(`/forensics?input=${encodeURIComponent(transactionHash)}&isTxid=true`);
    };


    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center space-x-2">
                <Wallet className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Saved Wallets & Transactions</h1>
            </div>

            <Tabs defaultValue="wallets" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wallets" className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>Wallets ({wallets.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4" />
                        <span>Transactions ({transactions.length})</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="wallets" className="space-y-4">
                    {getWalletsStatus.loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading wallets...</span>
                        </div>
                    ) : getWalletsStatus.error ? (
                        <div className="text-center py-8 text-red-500">
                            Error loading wallets: {getWalletsStatus.error}
                        </div>
                    ) : wallets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No saved wallets found
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {wallets.map((wallet, index) => (
                                <Card 
                                    key={`${wallet.wallet_address}-${index}`}
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
                                    onClick={() => handleWalletClick(wallet.wallet_address!)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center space-x-2">
                                                <Bitcoin className="h-5 w-5 text-orange-500" />
                                                <span>{wallet.wallet_name || 'Unnamed Wallet'}</span>
                                            </CardTitle>
                                            {wallet.suspicious_illegal_activity && (
                                                <Badge variant="destructive" className="flex items-center space-x-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span>Flagged</span>
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="font-mono text-xs break-all">
                                            {wallet.wallet_address}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {wallet.wallet_type && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Type:</span>
                                                    <Badge variant="outline">{wallet.wallet_type}</Badge>
                                                </div>
                                            )}
                                            {wallet.balance !== undefined && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Balance:</span>
                                                    <span className="font-semibold">{formatBTC(wallet.balance)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    {getAllTransactionsStatus.loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading transactions...</span>
                        </div>
                    ) : getAllTransactionsStatus.error ? (
                        <div className="text-center py-8 text-red-500">
                            Error loading transactions: {getAllTransactionsStatus.error}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No saved transactions found
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {transactions.map((transaction) => (
                                <Card 
                                    key={transaction.id}
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
                                    onClick={() => handleTransactionClick(transaction.transaction_hash)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center space-x-2">
                                                <Receipt className="h-5 w-5 text-green-500" />
                                                <span>Transaction</span>
                                            </CardTitle>
                                            {transaction.suspicious_illegal_activity && (
                                                <Badge variant="destructive" className="flex items-center space-x-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span>Flagged</span>
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="font-mono text-xs break-all">
                                            {transaction.transaction_hash}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Input:</span>
                                                <span className="font-semibold text-red-600">
                                                    -{formatBTC(transaction.total_input)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Output:</span>
                                                <span className="font-semibold text-green-600">
                                                    +{formatBTC(transaction.total_output)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Fee:</span>
                                                <span className="font-medium">
                                                    {formatBTC(transaction.fee)}
                                                </span>
                                            </div>
                                            {transaction.timestamp && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Date:</span>
                                                    <span className="text-sm flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            {format(new Date(transaction.timestamp * 1000), 'MMM dd, yyyy')}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}