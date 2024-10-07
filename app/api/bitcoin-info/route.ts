import { NextResponse } from 'next/server'

const RPC_URL = process.env.BITCOIN_RPC_URL || 'http://localhost:8332'
const RPC_USER = process.env.BITCOIN_RPC_USER || 'rpcuser'
const RPC_PASSWORD = process.env.BITCOIN_RPC_PASSWORD || 'rpcpassword'

export async function GET() {
    console.log('API route hit')
    console.log('RPC_URL:', RPC_URL)
    console.log('RPC_USER:', RPC_USER)
    console.log('RPC_PASSWORD:', RPC_PASSWORD)

    try {
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + Buffer.from(`${RPC_USER}:${RPC_PASSWORD}`).toString('base64'),
            },
            body: JSON.stringify({
                jsonrpc: '1.0',
                id: 'curltest',
                method: 'getblockchaininfo',
                params: [],
            }),
        })

        console.log('Response status:', response.status)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Received data:', data)

        return NextResponse.json(data.result)
    } catch (error) {
        console.error('Detailed error:', error)
        return NextResponse.json({ error: 'Failed to fetch Bitcoin info' }, { status: 500 })
    }
}