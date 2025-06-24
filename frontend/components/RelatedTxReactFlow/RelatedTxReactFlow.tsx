'use client';
import {useCallback, useEffect} from 'react';
import {
    ReactFlow,
    Background,
    Node,
    Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {AnimatedSvgEdge} from '@/components/animated-svg-edge';
import {ZoomSlider} from '@/components/zoom-slider';
import {formatAddress} from '@/utils/formatters';
import {LabeledGroupNode} from '@/components/labeled-group-node';
import { useTransactionStore } from '@/store/useTransactionStore';
import {CustomNodeData, TransactionFlowProps} from "@/types/relatedTx.types";
import SaveTransactionButton from "@/components/SaveTransactionButton/SaveTransactionButton";

export function RelatedTxReactFlow({transactionId, zoomFactor = 1 }: TransactionFlowProps) {
    // const router = useRouter();


    const {
        relatedTxData,
        nodes,
        edges,
        loading,
        setTransactionId,
        setNodes,
        setEdges,
        selectNode,
        openPanel,
        onNodesChange,
        onEdgesChange,
        fetchRelatedTx
    } = useTransactionStore();

    // Set the transaction ID in the store
    useEffect(() => {
        setTransactionId(transactionId);
    }, [transactionId, setTransactionId]);

    const nodeTypes = {
        group: LabeledGroupNode,
    };

    const edgeTypes = {
        animatedSvgEdge: AnimatedSvgEdge,
    };

    // Fetch related transaction data when transaction ID changes
    useEffect(() => {
        if (transactionId) {
            fetchRelatedTx(transactionId);
        }
    }, [transactionId, fetchRelatedTx]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node<CustomNodeData>) => {
        selectNode(node);
        openPanel();
    }, [selectNode, openPanel]);
/*
    const handleViewDetails = useCallback((txid: string) => {
        router.push(`/forensics?input=${txid}&isTxid=true`);
    }, [router]);
 */

    useEffect(() => {
        if (!relatedTxData) return;

        // Layout constants
        const inputX = 0;
        const mainX = 350;
        const ySpacing = 120;
        const nodeWidth = 220;

        // Input nodes (these are the related transactions)
        const inputNodes: Node<CustomNodeData>[] = Object.values(relatedTxData.related_txids).map((txObj, i) => ({
            id: `input-${txObj.id}`,
            data: { 
                label: formatAddress(txObj.data.label),
                timestamp: txObj.data.timestamp,
                amount: txObj.data.amount,
                priceAtTime: txObj.data.priceAtTime,
            },
            position: { x: inputX, y: i * ySpacing },
            type: 'default',
            zIndex: 1,
            style: {
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                border: '2px solid #F7931A',
                borderRadius: '12px',
                padding: '16px',
                width: `${nodeWidth}px`,
                textAlign: 'center',
                boxShadow: '0 4px 16px 0 #F7931A22, 0 1.5px 0 0 #fff2',
                backdropFilter: 'blur(8px)',
                transition: 'box-shadow 0.2s, border 0.2s',
                cursor: 'pointer',
            }
        }));

        // Main transaction node (centered vertically)
        const mainNodeY = (inputNodes.length > 0 ? (inputNodes.length - 1) * ySpacing / 2 : 0);
        const mainNode: Node<CustomNodeData> = {
            id: 'main-tx',
            data: { 
                label: formatAddress(relatedTxData.data.label),
                timestamp: relatedTxData.data.timestamp,
                amount: relatedTxData.data.amount,
                priceAtTime: relatedTxData.data.priceAtTime,
            },
            position: { x: mainX, y: mainNodeY },
            type: 'default',
            zIndex: 2,
            style: {
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                border: '2px solid #F7931A',
                borderRadius: '12px',
                padding: '16px',
                width: `${nodeWidth}px`,
                textAlign: 'center',
                boxShadow: '0 4px 16px 0 #F7931A22, 0 1.5px 0 0 #fff2',
                backdropFilter: 'blur(8px)',
                transition: 'box-shadow 0.2s, border 0.2s',
                cursor: 'pointer',
            }
        };

        // Edges: inputs -> main
        const inputEdges: Edge[] = inputNodes.map(node => ({
            id: `${node.id}-main`,
            source: node.id,
            target: 'main-tx',
            type: 'animatedSvgEdge',
            data: {
                duration: 2,
                shape: 'bitcoin',
                path: 'smoothstep',
            },
            style: {
                stroke: '#F7931A',
                strokeWidth: 2,
            },
            animated: true,
            zIndex: 0,
        }));

        const newNodes = [...inputNodes, mainNode];
        const newEdges = [...inputEdges];

        setNodes(newNodes);
        setEdges(newEdges);
    }, [relatedTxData, setNodes, setEdges]);

    // We're using the store's onNodesChange and onEdgesChange directly
    // No need for local implementations

    // Handle empty state with just the framework while loading or no data
    if (loading || !relatedTxData) {
        return (
            <div className="h-full w-full">
                <ReactFlow
                    nodes={[]}
                    edges={[]}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultViewport={{ x: 0, y: 0, zoom: zoomFactor }}
                >
                    <Background />
                    <ZoomSlider />
                </ReactFlow>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            {/* Add Save Transaction Button for the main transaction */}
            {relatedTxData && (
                <div className="absolute top-4 right-4 z-10">
                    <SaveTransactionButton
                        transactionData={{
                            txid: transactionId ?? '',
                            amount: relatedTxData.data.amount,
                            timestamp: relatedTxData.data.timestamp,
                        }}
                    />
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                defaultViewport={{ x: 0, y: 0, zoom: zoomFactor }}
            >
                <Background />
                <ZoomSlider />
            </ReactFlow>

            {/*<TransactionDetailsPanel
                onViewDetails={handleViewDetails}
            />*/}
        </div>
    );
}