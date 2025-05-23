import {TransactionDetails} from "@/components/TransactionDetails/TransactionDetails";
import {TransactionFlow} from "@/components/TransactionFlow/TransactionFlow";
import {MempoolTransaction, Transaction, TransactionInfoProps} from "@/types/transactions.types";
import {RelatedTxReactFlow} from "@/components/RelatedTxReactFlow";

export default function TransactionInfo({ transaction, mempoolTransaction }: TransactionInfoProps) {
    const txid = transaction?.transaction?.txid || mempoolTransaction?.transaction?.txid || null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Related Transactions visualized</h2>

            {txid && (
                <div className="mt-6 flex flex-col md:flex-row">
                    <div className="h-[500px] w-2/3 border rounded-lg overflow-hidden">
                        <RelatedTxReactFlow transactionId={txid} zoomFactor={0.6} />
                    </div>
                    {mempoolTransaction?.transaction && <TransactionFlow txData={(mempoolTransaction.transaction as MempoolTransaction)} />}
                </div>
            )}

            {transaction?.transaction && <TransactionDetails txData={(transaction.transaction as Transaction)} />}
        </div>
    )
}
