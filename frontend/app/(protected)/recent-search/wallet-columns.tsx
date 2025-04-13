"use client";

import {ColumnDef} from "@tanstack/react-table"
import {RecentWallet} from "@/types/wallet.types";
import {MoreHorizontal} from "lucide-react"
import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";

export const walletColumns: ColumnDef<RecentWallet>[] = [
    {
        accessorKey: "address",
        header: "Wallet Address",
        cell: ({row}) => {
            const address = row.original;
            return (
                <Link href={`/forensics?input=${address.wallet}&isTxid=false`}
                      className="hover:underline">
                    {address.wallet}
                </Link>
            );
        },
    },
    {
        accessorKey: "added",
        header: "Searched",
    },
    {
        id: "actions",
        cell: ({row}) => {
            const wallet = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(wallet.wallet)}
                        >
                            Copy Wallet Address
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <Link href={`/forensics?input=${wallet.wallet}&isTxid=false`}><DropdownMenuItem>View in
                            Forensics</DropdownMenuItem></Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
];