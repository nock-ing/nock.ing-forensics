'use client';
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
    Node,
    Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {AnimatedSvgEdge} from '@/components/animated-svg-edge';
import {ZoomSlider} from '@/components/zoom-slider';
import {formatAddress} from '@/utils/formatters';
import {LabeledGroupNode} from '@/components/labeled-group-node';
import { TransactionDetailsPanel } from '@/components/TransactionDetailsPanel/TransactionDetailsPanel';
import { useRouter } from 'next/navigation';

interface CustomNodeData {
    label: string;
    timestamp?: number;
    amount?: number;
    priceAtTime?: number;
    [key: string]: unknown;
}

type RelatedTxData = {
    id: string;
    data: {
        label: string;
        vout?: {
            scriptpubkey_address?: string;
            value: number;
        }[];
        timestamp?: number;
        amount?: number;
        priceAtTime?: number;
    };
    position: {
        x: number;
        y: number;
    };
    related_txids: Record<
        string,
        {
            id: string;
            data: { 
                label: string;
                timestamp?: number;
                amount?: number;
                priceAtTime?: number;
            };
            position: { x: number; y: number };
        }
    >;
};

interface TransactionFlowProps {
    transactionId: string | null;
    zoomFactor: number;
}

export function RelatedTxReactFlow({transactionId, zoomFactor = 1}: TransactionFlowProps) {
    const router = useRouter();
    const [relatedTxData, setRelatedTxData] = useState<RelatedTxData>();
    const [nodes, setNodes] = useNodesState<Node<CustomNodeData>>([]);
    const [edges, setEdges] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const nodeTypes = {
        group: LabeledGroupNode,
    };

    const edgeTypes = {
        animatedSvgEdge: AnimatedSvgEdge,
    };

    useEffect(() => {
        async function fetchRelatedTx() {
            if (!transactionId) {
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                const response = await fetch(`/api/redis-related-tx?txid=${transactionId}`);
                const data = await response.json();
                setRelatedTxData(data);
            } catch (error) {
                console.error("Error fetching related transactions:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRelatedTx();
    }, [transactionId]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node<CustomNodeData>) => {
        setSelectedNode(node);
        setIsPanelOpen(true);
    }, []);

    const handleViewDetails = useCallback((txid: string) => {
        router.push(`/transaction/${txid}`);
    }, [router]);

    const handleSaveTransaction = useCallback((txid: string) => {
        // TODO: Implement save transaction functionality
        console.log('Saving transaction:', txid);
    }, []);

    useEffect(() => {
        if (!relatedTxData) return;

        // Layout constants
        const inputX = 0;
        const mainX = 350;
        const outputX = 700;
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

    const handleNodesChange = useCallback(
        (changes: NodeChange<Node<CustomNodeData>>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const handleEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    // Helper function to get transaction data from node
    const getTransactionData = useCallback((node: Node<CustomNodeData>) => {
        if (!node || !transactionId) return null;
        
        const txid = node.id === 'main-tx' ? transactionId : node.id.replace('input-', '');
        return {
            txid,
            amount: node.data.amount || 0,
            timestamp: node.data.timestamp || 0,
            priceAtTime: node.data.priceAtTime,
        };
    }, [transactionId]);

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
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                defaultViewport={{ x: 0, y: 0, zoom: zoomFactor }}
            >
                <Background />
                <ZoomSlider />
            </ReactFlow>
            
            <TransactionDetailsPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                transaction={selectedNode ? getTransactionData(selectedNode) : null}
                onViewDetails={handleViewDetails}
                onSaveTransaction={handleSaveTransaction}
            />
        </div>
    );
}