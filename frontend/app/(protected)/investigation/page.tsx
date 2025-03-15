"use client";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import {useEffect, useState} from "react";
import {ReactFlow, useNodesState, useEdgesState} from "@xyflow/react";

type RelatedTxData = {
    id: string
    data: {
        label: string
    }
    position: {
        x: number;
        y: number;
    }

    related_txids: {
        txid: {
            id: string
            data: {
                label: string
            }
            position: {
                x: number;
                y: number;
            }
        }
    }[]
}

export default function Page() {
    const searchParams = useSearchParams();
    const search = searchParams.get('txid')
    const [relatedTxData, setRelatedTxData] = useState<RelatedTxData>()

    const initialNodes = [
        {
            id: relatedTxData?.id,
            data: { label: relatedTxData?.data.label },
            position: relatedTxData?.position
        }
    ];

    const initialEdges = [
        relatedTxData?.related_txids.map((relatedTx) => ({
            id: `${relatedTx.txid.id}-${relatedTx.txid.id}`,
            source: relatedTx.txid.id,
            target: relatedTx.txid.id,
            animated: true
        }))
    ]

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        async function fetchRelatedTx() {
            const response = await fetch(`/api/redis-related-tx?txid=${search}`);
            const data = await response.json();
            setRelatedTxData(data);
        }
        fetchRelatedTx();
    }, [search]);




    return (
        <div>
            { /* TODO: Show details passed from link here */ }
            <h1>Investigation Detail for {search} </h1>

            <Link href={"/investigations"}>
            <Button>
                Back to Investigations
            </Button>
            </Link>
            <div style={{ width: '100vw', height: '100vh' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}

                >
                </ReactFlow>
            </div>
        </div>
    )
}