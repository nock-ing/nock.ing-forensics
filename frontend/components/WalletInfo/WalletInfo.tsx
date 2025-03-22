import type {WalletData} from "@/types/wallet.types";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertCircle} from "lucide-react";
import {Separator} from "@/components/ui/separator";

type WalletInfoProps = {
    walletData: WalletData;
    walletLoading: boolean;
    walletError: string | null;
};

export default function WalletInfo({
                                       walletData,
                                       walletLoading,
                                       walletError,
                                   }: WalletInfoProps) {
    return (
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
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}