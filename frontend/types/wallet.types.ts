
export type WalletData = {
    timestamp?: string;
    address: number;
    total_received_sats: number;
    total_sent_sats: number;
    total_received_btc: number;
    total_sent_btc: number;
    balance_sats: number;
    balance_btc: number;
    tx_count: number;
    transactions: Transaction[];
}

type ScriptPubKey = {
    scriptpubkey: string;
    scriptpubkey_address: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    value: number;
};

type TxInput = {
    is_coinbase: boolean;
    prevout: ScriptPubKey;
    scriptsig: string;
    scriptsig_asm: string;
    sequence: number;
    txid: string;
    vout: number;
    witness: string[];
    inner_redeemscript_asm: string;
    inner_witnessscript_asm: string;
};

type TxOutput = {
    scriptpubkey: string;
    scriptpubkey_address: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    value: number;
};

type TransactionStatus = {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
};

type Transaction = {
    status: TransactionStatus;
    txid: string;
    version: number;
    locktime: number;
    size: number;
    weight: number;
    fee: number;
    vin: TxInput[];
    vout: TxOutput[];
};

export type WalletTxData = {
    address: string;
    transactions: Transaction[];
};

export type RecentWallets = {
    wallets: RecentWallet[];
}

export type RecentWallet = {
    wallet: string;
    added: string;
}

export type WalletsInDB = {
    wallet_name?: string;
    wallet_address?: string;
    wallet_type?: string;
    balance?: number;
    suspicious_illegal_activity?: boolean;
}
