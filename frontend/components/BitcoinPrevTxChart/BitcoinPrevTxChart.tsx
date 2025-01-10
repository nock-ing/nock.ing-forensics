import React from "react";
import { BarChart, XAxis, YAxis, Bar, Tooltip, LineChart, CartesianGrid, Line } from "recharts";
import { RelatedTransactionsProps } from "@/components/RelatedTransactions/relatedTransactions.types";

const TransactionCharts: React.FC<RelatedTransactionsProps> = ({ related_transactions }) => {
    // Data for the bar chart - Bitcoin value used per transaction
    const bitcoinValueData = related_transactions.map((tx) => ({
        txid: tx.txid,
        totalValue: tx.details.vout.reduce((acc, output) => acc + output.value, 0), // Total Bitcoin value in BTC
    }));

    // Data for the line chart - Transaction size
    const transactionSizeData = related_transactions.map((tx) => ({
        txid: tx.txid,
        size: tx.details.size,
    }));

    return (
        <div>
            <h2 className="text-lg font-bold">Bitcoin Value Used in Transactions</h2>
            <BarChart width={600} height={300} data={bitcoinValueData}>
                <XAxis dataKey="txid" hide={false} tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end"/>
                <YAxis/>
                <Tooltip formatter={(value: number) => `${value.toFixed(8)} BTC`}/>
                <Bar dataKey="totalValue" fill="#8884d8"/>
            </BarChart>

            <h2 className="text-lg font-bold mt-8">Transaction Size</h2>
            <LineChart width={600} height={300} data={transactionSizeData}>
                <XAxis dataKey="txid"/>
                <YAxis/>
                <CartesianGrid strokeDasharray="3 3"/>
                <Tooltip/>
                <Line type="monotone" dataKey="size" stroke="#82ca9d"/>
            </LineChart>
        </div>
    );
};

export default TransactionCharts;
