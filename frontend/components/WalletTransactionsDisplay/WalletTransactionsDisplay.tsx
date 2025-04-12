import React from "react";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {WalletTxData} from "@/types/wallet.types";
import {Copy, ExternalLink, FileDown} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import Link from "next/link";
import {satoshisToBTC} from "@/utils/formatters";
import {copyToClipboard} from "@/utils/copyToClipboard";
import {getWalletAmount} from "@/utils/transactionValueFetcher";
import {useHistoricalPrices} from "@/hooks/useHistoricalPrices";
import {useCoinAge} from "@/hooks/useCoinAge";
import PriceBasedGainCalculator from "@/components/PriceBasedGainCalculator/PriceBasedGainCalculator";
import {useCurrentPrice} from "@/hooks/useCurrentPrice";
import {Button} from "@/components/ui/button";
import {exportToCSV} from "@/utils/exportAsCsv";
import {getCookie} from "cookies-next";
import {HistoricalPrice} from "@/types/historicalPrice.types";


interface WalletTransactionsDisplayProps {
    data: WalletTxData;
}

export function WalletTransactionsDisplay({data}: WalletTransactionsDisplayProps) {
    const [selectedTxTimestamp, setSelectedTxTimestamp] = React.useState<string | undefined>(
        data?.transactions[0]?.status?.block_time?.toString()
    );
    const {priceData} = useHistoricalPrices(selectedTxTimestamp);
    const {coinAgeData, isLoading: coinAgeLoading} = useCoinAge(data?.address);
    const currentPrice = useCurrentPrice();
    const blockToTimestampMap = React.useMemo(() => {
        const map: Record<number, number> = {};

        // Populate map from transaction data
        data.transactions.forEach(tx => {
            if (tx.status?.block_height && tx.status?.block_time) {
                map[tx.status.block_height] = tx.status.block_time;
            }
        });

        return map;
    }, [data]);

    const [historicalPrices, setHistoricalPrices] = React.useState<{ [key: string]: HistoricalPrice }>({});
    React.useEffect(() => {
        if (!data?.transactions) return;

        const fetchAllPrices = async () => {
            const prices: { [key: string]: HistoricalPrice } = {};

            // Create a function to fetch a single price
            const fetchPrice = async (timestamp: string) => {
                try {
                    const token = getCookie("token") || localStorage.getItem("token");
                    const response = await fetch(`/api/historical-price?timestamp=${timestamp}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        return await response.json();
                    }
                } catch (error) {
                    console.error('Error fetching price data:', error);
                }
                return null;
            };

            // Fetch prices for all transactions with timestamps
            for (const tx of data.transactions) {
                const timestamp = tx.status?.block_time?.toString();
                if (timestamp && !prices[timestamp]) {
                    prices[timestamp] = await fetchPrice(timestamp);
                }
            }

            setHistoricalPrices(prices);
        };

        fetchAllPrices();
    }, [data?.transactions]);

    const handleSelectTransaction = (timestamp: string | undefined) => {
        setSelectedTxTimestamp(timestamp);
    };

    if (!data || !data.transactions || data.transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Wallet Transactions</CardTitle>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Wallet Transactions</CardTitle>
                <CardDescription className={"flex items-center justify-between"}>
                    <div>
                        Address: <span className="font-mono text-sm">{data.address}</span>
                        <Badge className="ml-2">{data.transactions.length} transactions</Badge>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToCSV(data, priceData, coinAgeData, currentPrice?.priceData, historicalPrices)}
                            className="flex items-center gap-2"
                        >
                            <FileDown className="h-4 w-4"/>
                            Export as CSV
                        </Button>
                    </div>
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
                                <TableHead>Held for/Gains</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.transactions.map((tx) => {
                                const txTimestamp = tx.status?.block_time?.toString();
                                const coinAgeDetail = coinAgeData?.coin_age_details?.find(
                                    (detail) => detail.txid === tx.txid
                                );

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
                                        <TableCell>
                                            {coinAgeLoading ? (
                                                <span className="text-muted-foreground">Loading...</span>
                                            ) : coinAgeDetail ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="font-medium">{coinAgeDetail.days_difference.toFixed(2)} days</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {coinAgeDetail.blocks_difference} blocks
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Amount: {coinAgeDetail.amount.toFixed(8)} BTC
                                                        {coinAgeDetail.spent_block && (
                                                            <PriceBasedGainCalculator
                                                                coinAgeDetail={coinAgeDetail}
                                                                blockToTimestampMap={blockToTimestampMap}
                                                                // Pass current price for unrealized gains calculation
                                                                currentPrice={currentPrice?.priceData?.EUR}
                                                                isRealized={!!coinAgeDetail.spent_block}
                                                            />

                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">No data</span>
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