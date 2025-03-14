"use client"

import {RelatedTransaction, RelatedTransactionsProps} from "@/components/RelatedTransactions/relatedTransactions.types";
import TransactionCard from "@/components/TransactionCard/TransactionCard";


export default function RelatedTransactions({ related_transactions }: RelatedTransactionsProps) {
    const normalizedRelatedTransactions = Array.isArray(related_transactions)
        ? related_transactions
        : related_transactions?.related_transactions ?? [];
    return (
        <div className="space-y-4">
            {normalizedRelatedTransactions.map((tx: RelatedTransaction) => (
                <TransactionCard key={tx.txid} transaction={tx} />
            ))}
        </div>
    )
}
