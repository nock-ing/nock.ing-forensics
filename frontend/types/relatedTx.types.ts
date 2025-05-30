export interface CustomNodeData {
    label: string;
    timestamp?: number;
    amount?: number;
    priceAtTime?: number;
    [key: string]: unknown;
}


export interface TransactionFlowProps {
    transactionId: string | null;
    zoomFactor: number;
}