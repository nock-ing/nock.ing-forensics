export interface Transaction {
    txid: string
    details: {
        confirmations: number
        time: number
        vin: Array<{
            txid: string
            vout: number
            value: number
        }>
        size: number
        vout: Array<{
            value: number
            n: number
            scriptPubKey: {
                address: string
            }
        }>
    }
}

export interface RelatedTransactionsProps {
    related_transactions: Transaction[]
}