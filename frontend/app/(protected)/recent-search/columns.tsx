"use client";

import {ColumnDef} from "@tanstack/react-table"
import {TransactionId} from "@/types/transactionId.types";
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

export const columns: ColumnDef<TransactionId>[] = [
    {
        accessorKey: "txid",
        header: "Transaction ID",
        cell: ({row}) => {
            const txid = row.getValue("txid") as string;
            return (
                <Link href={`/forensics?input=${txid}&isTxid=true`} className="hover:underline">
                    {txid}
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
            const txid = row.original;

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
                            onClick={() => navigator.clipboard.writeText(txid.txid)}
                        >
                            Copy Transaction ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <Link href={`/forensics?input=${txid.txid}&isTxid=true`}><DropdownMenuItem>View in
                            Forensics</DropdownMenuItem></Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
];