import React from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {WalletTxData} from "@/types/wallet.types";
import {Copy, ExternalLink} from "lucide-react"; // Import the icon components
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import Link from "next/link";
import {satoshisToBTC} from "@/utils/formatters";
import {copyToClipboard} from "@/utils/copyToClipboard";
import {getWalletAmount} from "@/utils/transactionValueFetcher";
import {useHistoricalPrices} from "@/hooks/useHistoricalPrices";


interface WalletTransactionsDisplayProps {
    data: WalletTxData;
}

export function WalletTransactionsDisplay({data}: WalletTransactionsDisplayProps) {
    const [selectedTxTimestamp, setSelectedTxTimestamp] = React.useState<string | undefined>(undefined);
    const {priceData} = useHistoricalPrices(selectedTxTimestamp);

    const handleSelectTransaction = (timestamp: string | undefined) => {
        setSelectedTxTimestamp(timestamp);
    };

    if (!data || !data.transactions || data.transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Wallet Transactions</CardTitle>
                    <CardDescription>No transactions found for this wallet</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Wallet Transactions</CardTitle>
                <CardDescription>
                    Address: <span className="font-mono text-sm">{data.address}</span>
                    <Badge className="ml-2">{data.transactions.length} transactions</Badge>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px]">
                    <Table>
                        <TableCaption>Transaction history for this wallet</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Inputs</TableHead>
                                <TableHead>Outputs</TableHead>
                                <TableHead className="text-right">Fee (sats)</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                <TableHead className="text-right">BTC Amount</TableHead>
                                <TableHead className="text-right">BTC Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.transactions.map((tx) => {
                                const txTimestamp = tx.status?.block_time?.toString();

                                return (
                                    <TableRow key={tx.txid} onClick={() => handleSelectTransaction(txTimestamp)}>
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                {tx.txid.substring(0, 10)}...
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => copyToClipboard(tx.txid)}
                                                                className="text-muted-foreground hover:text-primary"
                                                            >
                                                                <Copy size={16}/>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Copy transaction ID</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={`/forensics?input=${tx.txid}&isTxid=true`}
                                                                className="text-muted-foreground hover:text-primary"
                                                            >
                                                                <ExternalLink size={16}/>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View in Forensics</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {txTimestamp ? new Date(parseInt(txTimestamp) * 1000).toLocaleString() : 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {tx.vin.length} input{tx.vin.length !== 1 ? 's' : ''}
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {tx.vin.slice(0, 2).map((input, i) => (
                                                    <div key={i} className="truncate max-w-[180px]">
                                                        {input.is_coinbase ? 'Coinbase' :
                                                            input.prevout?.scriptpubkey_address || 'Unknown'}
                                                    </div>
                                                ))}
                                                {tx.vin.length > 2 && <div>+{tx.vin.length - 2} more</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {tx.vout.length} output{tx.vout.length !== 1 ? 's' : ''}
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {tx.vout.slice(0, 2).map((output, i) => (
                                                    <div key={i}
                                                         className="flex justify-between truncate max-w-[180px]">
                                                        <span>{output.scriptpubkey_address || 'Unknown'}</span>
                                                        <span
                                                            className="font-medium">{satoshisToBTC(output.value)} BTC</span>
                                                    </div>
                                                ))}
                                                {tx.vout.length > 2 && <div>+{tx.vout.length - 2} more</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{tx.fee}</TableCell>
                                        <TableCell className="text-right">{tx.size} bytes</TableCell>
                                        <TableCell className="text-right">
                                            {satoshisToBTC(getWalletAmount(tx, data.address))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {selectedTxTimestamp === txTimestamp && priceData ? (
                                                <div>
                                                    <div>{priceData.prices[0]?.EUR}€</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        ${priceData.prices[0]?.USD}
                                                        <p className={"text-xs text-muted-foreground"}>USD/EUR
                                                            Rate: {priceData.exchangeRates.USDEUR}</p></div>
                                                </div>

                                            ) : (
                                                "Select for price"
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}