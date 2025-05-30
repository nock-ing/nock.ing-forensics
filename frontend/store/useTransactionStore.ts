import { create } from 'zustand';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

// Define the types for our store
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

interface TransactionData {
  txid: string;
  amount: number;
  timestamp: number;
  priceAtTime?: number;
}

interface TransactionState {
  // Transaction data
  transactionId: string | null;
  relatedTxData: RelatedTxData | undefined;
  loading: boolean;
  
  // ReactFlow state
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  
  // Panel state
  selectedNode: Node<CustomNodeData> | null;
  isPanelOpen: boolean;
  
  // Actions
  setTransactionId: (id: string | null) => void;
  setRelatedTxData: (data: RelatedTxData | undefined) => void;
  setLoading: (loading: boolean) => void;
  setNodes: (nodes: Node<CustomNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  selectNode: (node: Node<CustomNodeData> | null) => void;
  openPanel: () => void;
  closePanel: () => void;
  getTransactionData: (node: Node<CustomNodeData>) => TransactionData | null;
  fetchRelatedTx: (txid: string) => Promise<void>;
}

// Create the store
export const useTransactionStore = create<TransactionState>((set, get) => ({
  // Initial state
  transactionId: null,
  relatedTxData: undefined,
  loading: false,
  nodes: [],
  edges: [],
  selectedNode: null,
  isPanelOpen: false,
  
  // Actions
  setTransactionId: (id) => set({ transactionId: id }),
  setRelatedTxData: (data) => set({ relatedTxData: data }),
  setLoading: (loading) => set({ loading }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<CustomNodeData>[]
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    });
  },
  
  selectNode: (node) => set({ selectedNode: node }),
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  
  getTransactionData: (node) => {
    const { transactionId } = get();
    if (!node || !transactionId) return null;
    
    const txid = node.id === 'main-tx' ? transactionId : node.id.replace('input-', '');
    return {
      txid,
      amount: node.data.amount || 0,
      timestamp: node.data.timestamp || 0,
      priceAtTime: node.data.priceAtTime,
    };
  },
  
  fetchRelatedTx: async (txid) => {
    if (!txid) return;
    
    try {
      set({ loading: true });
      const response = await fetch(`/api/redis-related-tx?txid=${txid}`);
      const data = await response.json();
      set({ relatedTxData: data });
    } catch (error) {
      console.error("Error fetching related transactions:", error);
    } finally {
      set({ loading: false });
    }
  }
}));