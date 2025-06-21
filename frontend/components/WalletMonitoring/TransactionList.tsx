import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { WalletTransaction } from '@/hooks/use-wallet-monitoring';
import { useRouter } from 'next/navigation';
import {formatAddress} from "@/utils/formatters";

interface TransactionListProps {
    transactions: WalletTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
    const router = useRouter();

    const handleViewDetails = (txid: string) => {
        router.push(`/forensics?input=${txid}&isTxid=true`);
    };

    if (transactions.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                        <p>Transactions will appear here once they&apos;re detected</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                    Latest transactions from your monitored addresses
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {tx.transaction_type === 'incoming' ? (
                                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="font-medium text-sm">
                                            {tx.transaction_type === 'incoming' ? 'Received' : 'Sent'}
                                        </span>
                                        <Badge variant={tx.confirmed ? "default" : "secondary"}>
                                            {tx.confirmed ? "Confirmed" : "Pending"}
                                        </Badge>
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {tx.amount_btc.toFixed(8)} BTC
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {tx.address.slice(0, 20)}...
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(tx.first_seen))} ago
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(tx.txid)}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Details
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                                {formatAddress(tx.txid)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}