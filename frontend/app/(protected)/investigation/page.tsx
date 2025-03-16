'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { AnimatedSvgEdge } from '@/components/animated-svg-edge';
import { ZoomSlider } from '@/components/zoom-slider';

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

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 1) Define your custom edge type
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

    // Create the main node
    const mainNode = {
      id: relatedTxData.id,
      data: relatedTxData.data,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: 'default',
    };

    // Create related nodes from the object
    const relatedNodes = Object.values(relatedTxData.related_txids).map(
      (txObj) => ({
        id: txObj.id,
        data: txObj.data,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        type: 'default',
      })
    );

    // Combine all nodes
    const newNodes = [mainNode, ...relatedNodes];

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
          path: 'smoothstep', // or "straight", "bezier", etc.
        },
      })
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [relatedTxData]);

  const handleNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const handleEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div>
      <h1>Investigation Detail for {search}</h1>
      <Link href={'/investigations'}>
        <Button>Back to Investigations</Button>
      </Link>

      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          fitView
          // 2) Use the custom edge types in your <ReactFlow>
          edgeTypes={edgeTypes}
        >
          <Background />
          <ZoomSlider position="top-left" />
        </ReactFlow>
      </div>
    </div>
  );
}
