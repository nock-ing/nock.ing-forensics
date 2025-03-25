
export interface CoinAgeData {
    hashid: string;
    coin_creation_block: number;
    current_block: number;
    age_in_blocks: number;
    age_in_days: number;
}


type CoinAgeDetails = {
    txid: string;
    prev_txid: string;
    received_block: number;
    spent_block: number;
    blocks_difference: number;
    days_difference: number;
    amount: number;
}

export type CoinAgeResponse = {
    address: string;
    transactions_count: number;
    coin_age_details: CoinAgeDetails[];
}