"use client"

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, YAxis } from "recharts";
import { RelatedTransactionsProps } from "@/components/RelatedTransactions/relatedTransactions.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const TransactionCharts: React.FC<RelatedTransactionsProps> = ({ related_transactions }) => {
    const normalizedRelatedTransactions = Array.isArray(related_transactions)
        ? related_transactions
        : related_transactions?.related_transactions ?? [];

    // Data for the bar chart - Bitcoin value used per transaction
    const bitcoinValueData = normalizedRelatedTransactions.map((tx, index) => ({
        txid: tx.txid,
        shortTxid: `Tx ${index + 1}`, // Shorter label for better display
        totalValue: tx.details.vout.reduce((acc, output) => acc + output.value, 0),
    }));

    // Data for the line chart - Transaction size
    const transactionSizeData = normalizedRelatedTransactions.map((tx, index) => ({
        txid: tx.txid,
        shortTxid: `Tx ${index + 1}`,
        size: tx.details.size,
    }));

    const bitcoinChartConfig = {
        totalValue: {
            label: "Bitcoin Value",
            color: "#f7931a",
        },
    } satisfies ChartConfig;

    const sizeChartConfig = {
        size: {
            label: "Transaction Size",
            color: "#f7931a",
        },
    } satisfies ChartConfig;

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Bitcoin Value Used in Transactions</CardTitle>
                    <CardDescription>
                        Total Bitcoin value per transaction
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={bitcoinChartConfig}>
                        <BarChart accessibilityLayer data={bitcoinValueData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="shortTxid"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent 
                                    formatter={(value) => [Number(value), " BTC"]}
                                    labelFormatter={(label, payload) => 
                                        payload?.[0]?.payload?.txid ? `Transaction: ${payload[0].payload.txid.slice(0, 8)}...` : label
                                    }
                                />}
                            />
                            <Bar 
                                dataKey="totalValue" 
                                fill="var(--color-totalValue)" 
                                radius={8} 
                            />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 leading-none font-medium">
                        {bitcoinValueData.length} transactions analyzed
                    </div>
                    <div className="text-muted-foreground leading-none">
                        Showing Bitcoin value distribution across transactions
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction Size Analysis</CardTitle>
                    <CardDescription>
                        Size trend across transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={sizeChartConfig}>
                        <LineChart accessibilityLayer data={transactionSizeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="shortTxid"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent 
                                    formatter={(value) => [`${Number(value)}`, " bytes (Size)"]}
                                    labelFormatter={(label, payload) => 
                                        payload?.[0]?.payload?.txid ? `Transaction: ${payload[0].payload.txid.slice(0, 8)}...` : label
                                    }
                                />}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="size" 
                                stroke="var(--color-size)" 
                                strokeWidth={2}
                                dot={{ fill: "var(--color-size)", strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 leading-none font-medium">
                        Transaction sizes in bytes
                    </div>
                    <div className="text-muted-foreground leading-none">
                        Showing size distribution across related transactions
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default TransactionCharts;