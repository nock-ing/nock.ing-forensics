"use client";
import type {WalletData} from "@/types/wallet.types";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Separator} from "@/components/ui/separator";
import "@xyflow/react/dist/style.css";
import WalletGraph from "@/components/WalletGraph/WalletGraph";
import {useEffect, useState, useCallback, useRef} from "react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {formatAddress, satoshisToBTC} from "@/utils/formatters";
import {useRouter} from 'next/navigation'
import {AlertCircle, ExternalLink, Flag, TrendingUp} from "lucide-react";
import SaveWalletButton from "@/components/SaveWalletButton/SaveWalletButton";
import {Button} from "@/components/ui/button";
import {useWalletApi} from "@/hooks/use-wallet-api";
import {toast} from "@/hooks/use-toast";
import { Pie, PieChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"


type WalletInfoProps = {
    walletData: WalletData;
    walletLoading: boolean;
    walletError: string | null;
    walletTransactions?: WalletData;
};

export default function WalletInfo({
                                       walletData,
                                       walletLoading,
                                       walletError,
                                       walletTransactions,
                                   }: WalletInfoProps) {

    const [isFlagged, setIsFlagged] = useState<boolean>(false);
    const [flagLoading, setFlagLoading] = useState<boolean>(false);
    const [isWalletSaved, setIsWalletSaved] = useState<boolean>(false);
    const [isCheckingSaved, setIsCheckingSaved] = useState<boolean>(true);
    const {flagWallet, getWallets} = useWalletApi();

    // Add ref to track the last checked address to prevent unnecessary re-fetches
    const lastCheckedAddress = useRef<string | null>(null);

    const [relatedWallets, setRelatedWallets] = useState<Set<string>>(new Set());
    const [walletConnectionFrequency, setWalletConnectionFrequency] = useState<Map<string, number>>(new Map());
    const router = useRouter();
    const [showSingleConnections] = useState<boolean>(true);

    // Memoize the wallet checking function to prevent recreation on every render
    const checkIfWalletIsFlagged = useCallback(async (address: string) => {
        try {
            setIsCheckingSaved(true);
            const savedWallets = await getWallets();

            if (savedWallets && savedWallets.length > 0) {
                const wallet = savedWallets.find(
                    w => w.wallet_address === address
                );

                if (wallet) {
                    setIsFlagged(!!wallet.suspicious_illegal_activity);
                    setIsWalletSaved(true);
                } else {
                    setIsWalletSaved(false);
                    setIsFlagged(false);
                }
            } else {
                setIsWalletSaved(false);
                setIsFlagged(false);
            }
        } catch (err) {
            console.error("Error checking wallet flag status:", err);
            setIsWalletSaved(false);
            setIsFlagged(false);
        } finally {
            setIsCheckingSaved(false);
        }
    }, [getWallets]);

    useEffect(() => {
        const currentAddress = walletData?.address?.toString();
        
        // Only run if we have a valid wallet address and it's different from the last checked one
        if (currentAddress && currentAddress !== lastCheckedAddress.current) {
            lastCheckedAddress.current = currentAddress;
            checkIfWalletIsFlagged(currentAddress);
        }
    }, [walletData?.address, checkIfWalletIsFlagged]);

    const handleFlagWallet = async () => {
        if (!walletData) return;

        // Check if wallet is saved before allowing flag operation
        if (!isWalletSaved) {
            toast({
                title: "Wallet not saved",
                description: "Wallet address not saved yet!",
                variant: "destructive",
            });
            return;
        }

        setFlagLoading(true);
        try {
            const newFlagStatus = !isFlagged;
            const result = await flagWallet(walletData.address.toString(), newFlagStatus);

            if (result) {
                setIsFlagged(newFlagStatus);
                toast({
                    title: newFlagStatus ? "Wallet flagged" : "Wallet unflagged",
                    description: newFlagStatus 
                        ? "The wallet has been flagged as suspicious." 
                        : "The wallet flag has been removed.",
                });
            }
        } catch (error) {
            console.error("Error flagging wallet:", error);
            toast({
                title: "Error",
                description: "Failed to update wallet flag status.",
                variant: "destructive",
            });
        } finally {
            setFlagLoading(false);
        }
    };

    // Function to handle when wallet is saved from SaveWalletButton
    const handleWalletSaved = useCallback(() => {
        setIsWalletSaved(true);
    }, []);

    useEffect(() => {
        if (!walletTransactions || !walletData) return;

        const connectedAddresses = new Set<string>();
        const connectionFrequency = new Map<string, number>();

        // Extract unique addresses from transaction inputs and outputs
        walletTransactions.transactions.forEach(tx => {
            // Extract addresses from inputs (sending to our wallet)
            tx.vin.forEach(input => {
                if (input.prevout && input.prevout.scriptpubkey_address) {
                    const address = input.prevout.scriptpubkey_address;
                    if (address !== walletData.address.toString()) {
                        connectedAddresses.add(address);
                        connectionFrequency.set(address, (connectionFrequency.get(address) || 0) + 1);
                    }
                }
            });

            // Extract addresses from outputs (our wallet sending to others)
            tx.vout.forEach(output => {
                if (output.scriptpubkey_address) {
                    const address = output.scriptpubkey_address;
                    if (address !== walletData.address.toString()) {
                        connectedAddresses.add(address);
                        connectionFrequency.set(address, (connectionFrequency.get(address) || 0) + 1);
                    }
                }
            });
        });

        setRelatedWallets(connectedAddresses);
        setWalletConnectionFrequency(connectionFrequency);
    }, [walletTransactions, walletData]);

    const handleWalletClick = useCallback((address: string) => {
        router.push(`/forensics?input=${address}&isTxid=false`);
    }, [router]);

    // Handle pie chart segment clicks
    const handlePieChartClick = useCallback((data: { payload?: { address?: string } }) => {
        if (data?.payload?.address) {
            handleWalletClick(data.payload.address);
        }
    }, [handleWalletClick]);

    const getLastActiveDays = useCallback(() => {
        if (!walletTransactions || walletTransactions.transactions.length === 0) {
            return null;
        }

        // Filter transactions that have valid block_time before sorting
        const validTransactions = walletTransactions.transactions.filter(
            tx => tx.status && typeof tx.status.block_time === 'number'
        );

        if (validTransactions.length === 0) {
            return null;
        }

        // Sort transactions by time (descending)
        const sortedTransactions = [...validTransactions].sort(
            (a, b) => (b.status?.block_time || 0) - (a.status?.block_time || 0)
        );

        // Get the most recent transaction time
        const lastTxTime = sortedTransactions[0].status?.block_time;
        if (lastTxTime === undefined) {
            return null;
        }

        const lastTxDate = new Date(lastTxTime * 1000); // Convert UNIX timestamp to milliseconds
        const currentDate = new Date();

        // Calculate difference in days
        const diffTime = currentDate.getTime() - lastTxDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }, [walletTransactions]);

    const getLastActiveDate = useCallback(() => {
        if (!walletTransactions || walletTransactions.transactions.length === 0) {
            return null;
        }

        // Filter transactions that have valid block_time before sorting
        const validTransactions = walletTransactions.transactions.filter(
            tx => tx.status && typeof tx.status.block_time === 'number'
        );

        if (validTransactions.length === 0) {
            return null;
        }

        // Sort transactions by time (descending)
        const sortedTransactions = [...validTransactions].sort(
            (a, b) => (b.status?.block_time || 0) - (a.status?.block_time || 0)
        );

        // Get the most recent transaction time
        const lastTxTime = sortedTransactions[0].status?.block_time;
        if (lastTxTime === undefined) {
            return null;
        }

        const lastTxDate = new Date(lastTxTime * 1000); // Convert UNIX timestamp to milliseconds

        // Format the date: YYYY-MM-DD HH:MM
        return lastTxDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [walletTransactions]);

// Alternative: Chart based on wallet counts
const generateConnectedWalletsChartData = useCallback(() => {
    if (walletConnectionFrequency.size === 0) {
        return [];
    }

    const chartData = [];
    let singleConnectionWallets = 0;
    let colorIndex = 1;

    // Sort connections by frequency (descending)
    const sortedConnections = Array.from(walletConnectionFrequency.entries())
        .sort(([,a], [,b]) => b - a);

    sortedConnections.forEach(([address, frequency]) => {
        if (frequency >= 3) {
            chartData.push({
                category: `${formatAddress(address)} (${frequency}x)`,
                count: 1, // Each wallet counts as 1 in the pie chart
                address: address,
                fill: `var(--color-wallet-${colorIndex})`,
            });
            colorIndex++;
        } else {
            singleConnectionWallets += 1;
        }
    });

    if (singleConnectionWallets > 0 && showSingleConnections) {
        chartData.push({
            category: `Single/Low Connections (${singleConnectionWallets} wallets)`,
            count: singleConnectionWallets, // Now this represents wallet count
            address: null,
            fill: `var(--color-single)`,
        });
    }

    return chartData;
}, [walletConnectionFrequency, showSingleConnections]);

    // Generate dynamic chart config based on the data
    const generateChartConfig = useCallback(() => {
        const config: ChartConfig = {
            count: {
                label: "Connections",
            },
            single: {
                label: "Single/Low Connections",
                color: "hsl(var(--muted-foreground))",
            },
        };

        // Add colors for individual wallets (using chart color variables)
        for (let i = 1; i <= 10; i++) {
            config[`wallet-${i}`] = {
                label: `Wallet ${i}`,
                color: `hsl(var(--chart-${i}))`,
            };
        }

        return config;
    }, [generateConnectedWalletsChartData]);

// Update the getConnectionStats function for better accuracy:
const getConnectionStats = useCallback(() => {
    if (walletConnectionFrequency.size === 0) {
        return null;
    }

    const frequencies = Array.from(walletConnectionFrequency.values());
    const singleConnections = frequencies.filter(f => f === 1).length;
    const lowConnections = frequencies.filter(f => f >= 1 && f < 3).length; // Changed to include 2-connection wallets
    const frequentConnections = frequencies.filter(f => f >= 3).length;
    const totalConnections = frequencies.length;
    const maxConnections = Math.max(...frequencies);
    const totalInteractions = frequencies.reduce((a, b) => a + b, 0);

    return {
        singleConnections,
        lowConnections, // Added this for better categorization
        frequentConnections,
        totalConnections,
        maxConnections,
        totalInteractions,
        isHighlyDiversified: lowConnections / totalConnections >= 0.8 // Changed to use lowConnections
    };
}, [walletConnectionFrequency]);

    const connectionStats = getConnectionStats();
    const chartData = generateConnectedWalletsChartData();
    const chartConfig = generateChartConfig();

    return (
        <>
        <div className="flex flex-col md:flex-row gap-6 w-full">
            <Card className="w-1/3">
                <CardHeader className={"flex justify-between pb-2"}>
                    <CardTitle>Wallet Data Analysis </CardTitle>
                    {!walletLoading && walletData && (
                        <SaveWalletButton 
                            walletData={walletData}
                            onWalletSaved={handleWalletSaved}
                        />
                    )}

                    <Button
                        onClick={handleFlagWallet}
                        disabled={flagLoading || isCheckingSaved || !isWalletSaved}
                        variant={isFlagged ? "destructive" : "outline"}
                        className="ml-2"
                        title={!isWalletSaved ? "Wallet must be saved before flagging" : ""}
                    >
                        {flagLoading ? "Updating..." :
                            isFlagged ? "Flagged" : "Flag as Suspicious"}
                        <Flag className="ml-2 h-4 w-4"/>
                    </Button>

                </CardHeader>
                <CardContent>
                    {walletLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4"/>
                            <Skeleton className="h-6 w-1/2"/>
                            <Skeleton className="h-6 w-2/3"/>
                            <Skeleton className="h-6 w-1/2"/>
                        </div>
                    )}

                    {walletError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{walletError}</AlertDescription>
                        </Alert>
                    )}

                    {!walletLoading && !walletError && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Wallet Address</h3>
                                <p className="mt-1">{walletData.address}</p>

                            </div>

                            <Separator/>

                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Last Activity</h3>
                                <p className="mt-1">
                                    {getLastActiveDate() !== null
                                        ? `${getLastActiveDate()} (${getLastActiveDays()} days ago) `
                                        : 'No transaction data available'}
                                </p>
                            </div>

                            <Separator/>


                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Balance</h3>
                                <p className="mt-1">{walletData.balance_btc < 0 ? 0 : satoshisToBTC(walletData.balance_sats)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{walletData.balance_sats < 0 ? 0 : walletData.balance_sats} sats</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex flex-col w-2/3 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Connected Wallets Pie Chart - Using shadcn structure */}
                    <Card className="flex flex-col">
                        <CardHeader className=" pb-0">
                            <CardTitle>Connection Analysis</CardTitle>
                            <CardDescription>
                                Wallet connections by interaction frequency
                            </CardDescription>
                            
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                            {chartData.length > 0 ? (
                                <ChartContainer
                                    config={chartConfig}
                                    className="mx-auto aspect-square max-h-[250px]"
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent 
                                                hideLabel 
                                                formatter={(value, name) => [undefined, name]}
                                                labelFormatter={() => ''}
                                            />}
                                        />
                                        <Pie
                                            data={chartData}
                                            dataKey="count"
                                            nameKey="category"
                                            onClick={handlePieChartClick}
                                            className="cursor-pointer"
                                        />
                                    </PieChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                    <div className="text-center">
                                        <p className="text-sm">No connected wallets found</p>
                                        <p className="text-xs mt-1">Load transaction data to see connections</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col gap-2 text-sm">
                            {connectionStats && (
                                <>
                                    <div className="flex items-center gap-2 leading-none font-medium">
                                        {connectionStats.isHighlyDiversified ? (
                                            <>
                                                Highly diversified connections
                                                <TrendingUp className="h-4 w-4" />
                                            </>
                                        ) : connectionStats.frequentConnections > 0 ? (
                                            <>
                                                {connectionStats.frequentConnections} frequent connections identified
                                                <TrendingUp className="h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                Mostly single connections
                                                <TrendingUp className="h-4 w-4" />
                                            </>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground leading-none text-center">
                                        {connectionStats.isHighlyDiversified ? (
                                            `${connectionStats.lowConnections}/${connectionStats.totalConnections} wallets with low activity`
                                        ) : (
                                            `Total: ${connectionStats.totalInteractions} interactions with ${connectionStats.totalConnections} unique wallets`
                                        )}
                                    </div>
                                </>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Related Wallets */}
                    <Card className="">
                        <CardHeader>
                            <CardTitle>Connected Wallets ({relatedWallets.size})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="max-h-80 overflow-y-auto">
                                <div className="space-y-2">
                                    {Array.from(relatedWallets).slice(0, 50).map((address) => (
                                        <div
                                            key={address}
                                            className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => handleWalletClick(address)}
                                        >
                                            <span className="text-sm font-mono">{formatAddress(address)}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {walletConnectionFrequency.get(address) || 0}x
                                                </span>
                                                <ExternalLink className="h-3 w-3 text-muted-foreground"/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>


            </div>

        </div>
            <div className={"mt-6 w-full"}>
                {/* Wallet Graph */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Wallet Activity Graph</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!walletLoading && !walletError && walletTransactions && (
                            <>
                                {relatedWallets.size > 120 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                        <div>
                                            <h3 className="font-medium text-lg">Too Many Connected Wallets</h3>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                This wallet has {relatedWallets.size} connected wallets.
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Graph visualization is disabled for wallets with more than 120 connections to maintain performance.
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Please refer to the &quot;Connected Wallets&quot; list on the right to explore the connections.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <WalletGraph
                                        walletData={walletData}
                                        relatedWallets={relatedWallets}
                                        onNodeClick={handleWalletClick}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            </>
    );
}