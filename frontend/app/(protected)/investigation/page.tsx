'use client';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useCallback, useEffect, useState} from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    applyNodeChanges,
    applyEdgeChanges,
    Background,
    EdgeChange,
    NodeChange,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import {AnimatedSvgEdge} from '@/components/animated-svg-edge';
import {ZoomSlider} from '@/components/zoom-slider';

import {formatAddress} from '@/utils/formatters';
import {LabeledGroupNode} from '@/components/labeled-group-node';

const nodeTypes = {
    group: LabeledGroupNode,
};

type RelatedTxData = {
    id: string;
    data: {
        label: string;
    };
    position: {
        x: number;
        y: number;
    };
    related_txids: Record<
        string,
        {
            id: string;
            data: { label: string };
            position: { x: number; y: number };
        }
    >;
};

export default function Page() {
    const searchParams = useSearchParams();
    const search = searchParams.get('txid');

    const [relatedTxData, setRelatedTxData] = useState<RelatedTxData>();

    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

    const edgeTypes = {
        animatedSvgEdge: AnimatedSvgEdge,
    };

    useEffect(() => {
        async function fetchRelatedTx() {
            if (!search) return;
            const response = await fetch(`/api/redis-related-tx?txid=${search}`);
            const data = await response.json();
            setRelatedTxData(data);
        }

        fetchRelatedTx();
    }, [search]);

    useEffect(() => {
        if (!relatedTxData) return;
        const groupNode = {
            id: 'input-group',
            type: 'group',
            position: {x: 0, y: 0},
            data: {label: 'Input Group'},
            style: {
                width: 500,
                height: 500,
            },
            zIndex: 0,
        };

        const relatedNodes = Object.values(relatedTxData.related_txids).map(
            (txObj, i) => ({
                id: txObj.id,
                data: {label: formatAddress(txObj.data.label)},
                position: {x: 50, y: 50 + i * 100}, // local to parent
                type: 'default',
                parentNode: 'input-group',
                extent: 'parent',
                zIndex: 1,
            })
        );

        const mainNode = {
            id: 'test',
            data: {
                label: 'Input Transaction',
            },
            position: {x: Math.random() * 400, y: Math.random() * 400},
            type: 'default',
            zIndex: 2,
        };

        const newNodes = [groupNode, ...relatedNodes, mainNode];

        // Build edges using the custom 'animatedSvgEdge' type
        const newEdges = Object.values(relatedTxData.related_txids).map(
            (txObj) => ({
                id: `${txObj.id}-${mainNode.id}`,
                source: txObj.id,
                target: mainNode.id,
                type: 'animatedSvgEdge',
                // Pass any props you want to the AnimatedSvgEdge via 'data'
                data: {
                    duration: 2, // how fast the animation flows
                    shape: 'package', // dot shape, "package" is from the example
                    path: 'straight',
                },
            })
        );

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setNodes(newNodes);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setEdges(newEdges);
    }, [relatedTxData, setNodes, setEdges]);

    const handleNodesChange = useCallback(
        (changes: NodeChange<never>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const handleEdgesChange = useCallback(
        (changes: EdgeChange<never>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    return (
        <div>
            <h1>Investigation Detail for {search}</h1>
            <Link href={'/investigations'}>
                <Button>Back to Investigations</Button>
            </Link>

            <div className="flex">
                <div
                    style={{width: '100vw', height: '100vh'}}
                    className="dark:text-black"
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        fitView
                        edgeTypes={edgeTypes}
                        nodeTypes={nodeTypes}
                    >
                        <Background/>
                        <ZoomSlider position="top-left"/>
                    </ReactFlow>
                </div>
                <div
                    style={{width: '100vw', height: '100vh'}}
                    className="dark:text-black"
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={handleEdgesChange}
                        fitView
                        edgeTypes={edgeTypes}
                        nodeTypes={nodeTypes}
                    >
                        <Background/>
                        <ZoomSlider position="top-left"/>
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
