"use client";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {useRecentTxids} from "@/hooks/use-recent-txids";
import {useRecentWallets} from "@/hooks/use-recent-wallets";
import {DataTable} from "@/app/(protected)/recent-search/data-table";
import {columns as txidColumns} from "@/app/(protected)/recent-search/columns";
import {convertIsoDateToLocaleString} from "@/utils/formatters";
import {walletColumns} from "@/app/(protected)/recent-search/wallet-columns";

export default function RecentSearches() {
    const {recentTxids: txidsData, loading: txidsLoading, error: txidsError} = useRecentTxids();

    const formattedTxids = txidsData.map(txid => ({
        ...txid,
        added: convertIsoDateToLocaleString(txid.added)
    }));

    const {recentWallets: walletsData, loading: walletsLoading, error: walletsError} = useRecentWallets();

    const formattedWallets = walletsData.map(wallet => ({
        ...wallet,
        added: convertIsoDateToLocaleString(wallet.added)
    }));

    return (
        <div>
            <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="wallets">Wallets</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions">
                    {txidsLoading && <p>Loading...</p>}
                    {txidsError && <p>{txidsError}</p>}
                    <ul>
                        {
                            <DataTable columns={txidColumns} data={formattedTxids}/>
                        }
                    </ul>
                </TabsContent>
                <TabsContent value="wallets">
                    {walletsLoading && <p>Loading...</p>}
                    {walletsError && <p>{walletsError}</p>}
                    <ul>
                        {
                            <DataTable columns={walletColumns} data={formattedWallets}/>
                        }
                    </ul>
                </TabsContent>
            </Tabs>
        </div>
    )
}