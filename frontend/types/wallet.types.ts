
export type WalletData = {
    wallet: number;
    tx_received: number;
    tx_value_received: number;
    tx_coins_spent: number;
    tx_coins_sum: number;
    balance_sats: number;
    balance: number;
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

type Transaction = {
    txid: string;
    version: number;
    locktime: number;
    size: number;
    weight: number;
    fee: number;
    vin: TxInput[];
    vout: TxOutput[];
};

// Complete wallet transaction data type
export type WalletTxData = {
    address: string;
    transactions: Transaction[];
};
