import {TransactionDetails} from "@/components/TransactionDetails/TransactionDetails";
import {TransactionFlow} from "@/components/TransactionFlow/TransactionFlow";
import {MempoolTransaction, Transaction, TransactionInfoProps} from "@/types/transactions.types";

export default function TransactionInfo({ isTxid, transaction, mempoolTransaction }: TransactionInfoProps) {
    const txData = mempoolTransaction

    if (!isTxid || !txData) {
        return (
            <div className="text-center p-4">
                <p className="text-lg font-semibold">No transaction data available</p>
                <p className="text-sm text-muted-foreground">
                    {isTxid ? "Unable to fetch transaction details" : "Please enter a valid transaction ID"}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <TransactionDetails txData={(transaction?.transaction as Transaction)} />
            <TransactionFlow txData={(txData?.transaction as MempoolTransaction)} />
        </div>
    )
}

