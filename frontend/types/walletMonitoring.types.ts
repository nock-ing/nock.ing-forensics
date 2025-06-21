

export type WalletMonitoringResponse = {
    id: number,
    txid: string,
    address: string,
    amount: number,
    amount_btc: number,
    transaction_type: string,
    confirmed: boolean,
    first_seen: string
}