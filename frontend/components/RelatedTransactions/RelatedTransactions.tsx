"use client"

import {RelatedTransactionsProps } from "@/components/RelatedTransactions/relatedTransactions.types";
import TransactionCard from "@/components/TransactionCard/TransactionCard";



export default function RelatedTransactions({ related_transactions}: RelatedTransactionsProps) {
    return (
        <div className="space-y-4">
            {related_transactions.map((tx) => (
                <TransactionCard key={tx.txid} transaction={tx} />
            ))}
        </div>
    )
}
