export interface CustomNodeData {
    label: string;
    timestamp?: number;
    amount?: number;
    priceAtTime?: number;
    [key: string]: unknown;
}


export interface TransactionFlowProps {
    transactionId: string | null;
    user_id: number;
    block_id: number;
    wallet_id: number;
    zoomFactor: number;
}