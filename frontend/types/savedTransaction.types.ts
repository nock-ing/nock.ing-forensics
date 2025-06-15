export interface SavedTransaction {
    id: number;
    wallet_id: number;
    user_id: number;
    block_id: number;
    transaction_hash: string;
    timestamp: number;
    total_input: number;
    total_output: number;
    fee: number;
    suspicious_illegal_activity: boolean;
}

export interface CreateTransactionRequest {
    wallet_id?: number;        // Remove ? to make required
    user_id?: number;          // Add this required field
    block_id?: number;         // Remove ? to make required
    transaction_hash: string;
    timestamp?: number;
    total_input?: number;
    total_output?: number;
    fee?: number;
    suspicious_illegal_activity?: boolean;
}

export interface UpdateTransactionRequest {
    wallet_id?: number;
    user_id?: number;         // Add this optional field for updates
    block_id?: number;
    transaction_hash?: string;
    timestamp?: number;
    total_input?: number;
    total_output?: number;
    fee?: number;
    suspicious_illegal_activity?: boolean;
}