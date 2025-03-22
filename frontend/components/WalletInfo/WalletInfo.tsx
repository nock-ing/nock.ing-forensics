import type {WalletData, WalletTxData} from "@/types/wallet.types";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertCircle} from "lucide-react";
import {Separator} from "@/components/ui/separator";
import "@xyflow/react/dist/style.css";
import WalletGraph from "@/components/WalletGraph/WalletGraph";
import {useEffect, useState} from "react";

type WalletInfoProps = {
    walletData: WalletData;
    walletLoading: boolean;
    walletError: string | null;
    walletTransactions?: WalletTxData;
};

export default function WalletInfo({
                                       walletData,
                                       walletLoading,
                                       walletError,
                                       walletTransactions,
                                   }: WalletInfoProps) {

    const [relatedWallets, setRelatedWallets] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!walletTransactions || !walletData) return;

        const connectedAddresses = new Set<string>();

        // Extract unique addresses from transaction inputs and outputs
        walletTransactions.transactions.forEach(tx => {
            // Extract addresses from inputs (sending to our wallet)
            tx.vin.forEach(input => {
                if (input.prevout && input.prevout.scriptpubkey_address) {
                    const address = input.prevout.scriptpubkey_address;
                    if (address !== walletData.address.toString()) {
                        connectedAddresses.add(address);
                    }
                }
            });

            // Extract addresses from outputs (our wallet sending to others)
            tx.vout.forEach(output => {
                if (output.scriptpubkey_address) {
                    const address = output.scriptpubkey_address;
                    if (address !== walletData.address.toString()) {
                        connectedAddresses.add(address);
                    }
                }
            });
        });

        setRelatedWallets(connectedAddresses);
    }, [walletTransactions, walletData]);


    return (
        <div className="flex flex-col md:flex-row gap-6 w-full">
            <Card className="w-1/3">
                <CardHeader>
                    <CardTitle>Wallet Data Analysis</CardTitle>
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
                                <h3 className="font-medium text-sm text-muted-foreground">Balance</h3>
                                <p className="mt-1">{walletData.balance_btc < 0 ? 0 : walletData.balance_sats} BTC</p>
                                <p className="mt-1 text-xs text-muted-foreground">{walletData.balance_sats < 0 ? 0 : walletData.balance_sats} sats</p>
                            </div>

                            <Separator/>

                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">BTC Received</h3>
                                <p className="mt-1">{walletData.total_received_btc} BTC</p>
                                <p className="mt-1 text-xs text-muted-foreground">{walletData.total_received_sats} sats</p>
                            </div>

                            <Separator/>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">BTC Sent</h3>
                                <p className="mt-1">{walletData.total_sent_btc} BTC</p>
                                <p className="mt-1 text-xs text-muted-foreground">{walletData.total_sent_sats} sats</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className={"w-full dark:text-black"}>
                <CardHeader>
                    <CardTitle>Wallet Transactions Graph</CardTitle>
                </CardHeader>
                <CardContent>
                    {walletLoading ? (
                        <Skeleton className="h-[400px] w-full"/>
                    ) : walletError ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{walletError}</AlertDescription>
                        </Alert>
                    ) : (
                        relatedWallets.size > 0 && walletData ? (
                            <WalletGraph
                                walletData={walletData}
                                relatedWallets={relatedWallets}
                            />
                        ) : (
                            <Alert>
                                <AlertDescription>No related wallets found.</AlertDescription>
                            </Alert>
                        )
                    )}
                </CardContent>
            </Card>

        </div>
    );
}