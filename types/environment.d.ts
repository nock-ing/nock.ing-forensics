declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BITCOIN_RPC_URL: string;
            BITCOIN_RPC_USER: string;
            BITCOIN_RPC_PASSWORD: string;
        }
    }
  interface BlockchainInfo {
    chain: string
    blocks: number
    headers: number
    bestblockhash: string
    difficulty: number
    mediantime: number
    verificationprogress: number
    initialblockdownload: boolean
    chainwork: string
    size_on_disk: number
    pruned: boolean
    warnings: string
}

interface RecentBlock {
    height: number
    hash: string
    time: number
    txcount: number
} 
}
  
export {}
