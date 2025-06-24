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

// Store for individual transaction details
interface TransactionDetails {
  [txid: string]: {
    amount: number;
    timestamp: number;
    priceAtTime?: number;
    fee?: number;
    size?: number;
  };
}

interface TransactionState {
  // Transaction data
  transactionId: string | null;
  relatedTxData: RelatedTxData | undefined;
  transactionDetails: TransactionDetails;
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
  fetchTransactionDetails: (txid: string) => Promise<void>;
}

// Create the store
export const useTransactionStore = create<TransactionState>((set, get) => ({
  // Initial state
  transactionId: null,
  relatedTxData: undefined,
  transactionDetails: {},
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
    const { transactionId, transactionDetails } = get();
    if (!node || !transactionId) return null;
    
    let txid;
    
    if (node.id === 'main-tx') {
      txid = transactionId;
    } else {
      txid = node.id.replace('input-', '');
    }
    
    // Get details from the transactionDetails store
    const details = transactionDetails[txid];
    
    if (!details) {
      console.warn('No transaction details found for:', txid);
      return {
        txid,
        amount: 0,
        timestamp: Date.now() / 1000,
        priceAtTime: undefined,
      };
    }
    
    const result = {
      txid,
      amount: details.amount,
      timestamp: details.timestamp,
      priceAtTime: details.priceAtTime,
    };
    
    console.log('Transaction data for', txid, ':', result);
    return result;
  },
  
  fetchTransactionDetails: async (txid) => {
    try {
      const response = await fetch(`/api/tx-info?txid=${txid}`);
      const data = await response.json();
      
      console.log(`Transaction details for ${txid}:`, data);
      
      // Extract relevant information from the tx-info API response
      // You'll need to adjust this based on your actual API response structure
      let amount = 0;
      let timestamp = 0;
      
      // Calculate total output amount (you might want to adjust this logic)
      if (data.vout && Array.isArray(data.vout)) {
        amount = data.vout.reduce((total: number, output: any) => total + (output.value || 0), 0);
      }
      
      // Get timestamp from block time or status
      if (data.status?.block_time) {
        timestamp = data.status.block_time;
      }
      
      // Update the store with transaction details
      set((state) => ({
        transactionDetails: {
          ...state.transactionDetails,
          [txid]: {
            amount,
            timestamp,
            fee: data.fee,
            size: data.size,
          }
        }
      }));
      
    } catch (error) {
      console.error(`Error fetching transaction details for ${txid}:`, error);
    }
  },
  
  fetchRelatedTx: async (txid) => {
    if (!txid) return;
    
    try {
      set({ loading: true });
      
      // Fetch related transactions
      const response = await fetch(`/api/redis-related-tx?txid=${txid}`);
      const data = await response.json();
      
      console.log('Related TX API Response:', data);
      set({ relatedTxData: data });
      
      // Fetch details for the main transaction
      await get().fetchTransactionDetails(txid);
      
      // Fetch details for all related transactions
      const relatedTxIds = Object.keys(data.related_txids || {});
      await Promise.all(
        relatedTxIds.map(relatedTxId => get().fetchTransactionDetails(relatedTxId))
      );
      
    } catch (error) {
      console.error("Error fetching related transactions:", error);
    } finally {
      set({ loading: false });
    }
  }
}));