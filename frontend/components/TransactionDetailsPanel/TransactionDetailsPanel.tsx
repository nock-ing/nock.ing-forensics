import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useTransactionStore } from '@/store/useTransactionStore';

interface TransactionDetailsPanelProps {
    onViewDetails: (txid: string) => void;
    onSaveTransaction: (txid: string) => void;
}

export function TransactionDetailsPanel({
    onViewDetails,
    onSaveTransaction,
}: TransactionDetailsPanelProps) {
    // Use the Zustand store
    const { 
        isPanelOpen, 
        closePanel, 
        selectedNode, 
        getTransactionData 
    } = useTransactionStore();

    // Get transaction data from the selected node
    const transaction = selectedNode ? getTransactionData(selectedNode) : null;

    // Early return if panel is closed or no transaction is selected
    if (!isPanelOpen || !transaction) return null;

    const formattedAmount = (transaction.amount / 100000000).toFixed(8); // Convert satoshis to BTC
    const formattedTime = formatDistanceToNow(new Date(transaction.timestamp * 1000), { addSuffix: true });
    const usdValue = transaction.priceAtTime 
        ? `$${(transaction.amount / 100000000 * transaction.priceAtTime).toFixed(2)}`
        : 'Price data unavailable';

    return (
        <Card className="fixed right-4 top-4 w-96 p-6 shadow-lg bg-card border-2 border-[#F7931A]">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Transaction Details</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={closePanel}
                    className="hover:bg-transparent"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm break-all">{transaction.txid}</p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">{formattedAmount} BTC</p>
                    <p className="text-sm text-muted-foreground">{usdValue}</p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p>{formattedTime}</p>
                </div>

                <div className="flex gap-2 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1 border-[#F7931A] text-[#F7931A] hover:bg-[#F7931A] hover:text-white"
                        onClick={() => onViewDetails(transaction.txid)}
                    >
                        View Details
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-[#F7931A] text-[#F7931A] hover:bg-[#F7931A] hover:text-white"
                        onClick={() => onSaveTransaction(transaction.txid)}
                    >
                        Save Transaction
                    </Button>
                </div>
            </div>
        </Card>
    );
} 
