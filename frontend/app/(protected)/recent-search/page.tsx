"use client";
import {TransactionId} from "@/types/transactionId.types";
import {useEffect, useState} from "react";
import {getCookie} from "cookies-next";
import {DataTable} from "@/app/(protected)/recent-search/data-table";
import {columns} from "@/app/(protected)/recent-search/columns";
import {convertIsoDateToLocaleString} from "@/utils/formatters";


export default function Page() {
    const [recentTxids, setRecentTxids] = useState<TransactionId[]>([]);
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        async function fetchRecentTxids() {
            try {

                setLoading(true);
                setError(null);
                const token = getCookie("token");
                const response = await fetch(`/api/recent-txids`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (!response.ok) {
                    throw new Error("Failed to fetch recent txids");
                }

                const data: TransactionId[] = await response.json();
                setRecentTxids(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchRecentTxids();
    }, []);

    recentTxids.forEach((txid) => {
        txid.added = convertIsoDateToLocaleString(txid.added);
    });
    return (
        <div>
            <h1>Recent Search</h1>
            {loading && <p>Loading...</p>}

            {error && <p>{error}</p>}

            <ul>
                {
                    <DataTable columns={columns} data={recentTxids}/>
                }
            </ul>
        </div>
    )
}