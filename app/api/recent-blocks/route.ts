import { NextResponse } from 'next/server'

const RPC_URL = process.env.BITCOIN_RPC_URL || 'http://localhost:8332'
const RPC_USER = process.env.BITCOIN_RPC_USER || 'rpcuser'
const RPC_PASSWORD = process.env.BITCOIN_RPC_PASSWORD || 'rpcpassword'

async function rpcCall(method: string, params?: [number]) {
    const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + Buffer.from(`${RPC_USER}:${RPC_PASSWORD}`).toString('base64'),
        },
        body: JSON.stringify({
            jsonrpc: '1.0',
            id: 'curltest',
            method,
            params,
        }),
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.result
}

export async function GET() {
    try {
        // Get the current block count
        const blockCount = await rpcCall('getblockcount')

        // Fetch the 5 most recent blocks
        const recentBlocks = []
        for (let i = 0; i < 5; i++) {
            const blockHash = await rpcCall('getblockhash', [blockCount - i])
            const blockInfo = await rpcCall('getblock', [blockHash])
            recentBlocks.push({
                height: blockInfo.height,
                hash: blockInfo.hash,
                time: blockInfo.time,
                txcount: blockInfo.nTx
            })
        }

        return NextResponse.json(recentBlocks)
    } catch (error) {
        console.error('Detailed error:', error)
        return NextResponse.json({ error: 'Failed to fetch recent blocks' }, { status: 500 })
    }
}