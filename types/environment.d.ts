declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BITCOIN_RPC_URL: string;
            BITCOIN_RPC_USER: string;
            BITCOIN_RPC_PASSWORD: string;
        }
    }
}

export {}