export type MempoolTransaction = {
    txid: string
    version: number
    locktime: number
    size: number
    weight: number
    fee: number
    vin: Array<{
        txid: string
        vout: number
        prevout: {
            scriptpubkey: string
            scriptpubkey_address: string
            value: number
        }
        scriptsig: string
        sequence: number
    }>
    vout: Array<{
        scriptpubkey: string
        scriptpubkey_address: string
        value: number
        scriptPubKey: {
            asm: string
            hex: string
            reqSigs: number
            type: string
            addresses: string[]
            address: string
        }
    }>
    status: {
        confirmed: boolean
        block_height: number
        block_hash: string
        block_time: number
    }
}

export type Transaction = {
    txid: string
    hash: string
    version: number
    size: number
    vsize: number
    weight: number
    locktime: number
    vin: Array<{
        txid: string
        vout: number
        scriptSig: {
            asm: string
            hex: string
        }
        txinwitness: string[]
        sequence: number
    }>
    vout: Array<{
        value: number
        n: number
        scriptPubKey: {
            asm: string
            desc: string
            hex: string
            address: string
            type: string
        }
    }>
    hex: string
    blockhash: string
    confirmations: number
    time: number
    blocktime: number
}

export interface TransactionDetailsProps {
    transaction: Transaction | MempoolTransaction
    txid: string
}


export interface TransactionInfoProps {
    isTxid: boolean
    input: string
    transaction: TransactionDetailsProps | undefined
    mempoolTransaction: TransactionDetailsProps | undefined
}

