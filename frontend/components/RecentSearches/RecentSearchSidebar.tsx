"use client";

import { useRecentTxids } from "@/hooks/use-recent-txids";
import { useRecentWallets } from "@/hooks/use-recent-wallets";
import { convertIsoDateToLocaleString } from "@/utils/formatters";
import Link from "next/link";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { FileSearch } from "lucide-react";

export function RecentSearchSidebar() {
    const { recentTxids: txidsData, loading: txidsLoading } = useRecentTxids();
    const { recentWallets: walletsData, loading: walletsLoading } = useRecentWallets();

    // Combine and sort recent searches by date
    const recentSearches = [
        ...txidsData.map(txid => ({
            type: 'txid',
            value: txid.txid,
            added: new Date(txid.added)
        })),
        ...walletsData.map(wallet => ({
            type: 'wallet',
            value: wallet.wallet,
            added: new Date(wallet.added)
        }))
    ].sort((a, b) => b.added.getTime() - a.added.getTime())
    .slice(0, 5); // Show only the 5 most recent searches

    if (txidsLoading || walletsLoading) {
        return null;
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>
                <FileSearch className="mr-2" />
                Recent Searches
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {recentSearches.map((search, index) => (
                        <SidebarMenuItem key={`${search.type}-${search.value}-${index}`}>
                            <SidebarMenuButton asChild>
                                <Link 
                                    href={`/forensics?input=${search.value}&isTxid=${search.type === 'txid'}`}
                                    className="flex items-center gap-2"
                                >
                                    <span className="truncate">{search.value}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {convertIsoDateToLocaleString(search.added.toISOString())}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
} 