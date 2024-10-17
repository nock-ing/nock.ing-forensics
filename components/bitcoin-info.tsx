'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

export default function BitcoinInfo() {
    const [info, setInfo] = useState<BlockchainInfo | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchBitcoinInfo = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/bitcoin-info')
            if (!response.ok) {
                throw new Error('Failed to fetch Bitcoin info')
            }
            const data = await response.json()
            setInfo(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBitcoinInfo()
    }, [])

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Bitcoin Blockchain Info</CardTitle>
                <CardDescription>Current state of the Bitcoin blockchain</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Loading...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}
                {info && (
                    <div className="space-y-2">
                        <p><strong>Chain:</strong> {info.chain}</p>
                        <p><strong>Blocks:</strong> {info.blocks}</p>
                        <p><strong>Headers:</strong> {info.headers}</p>
                        <p><strong>Best Block Hash:</strong> {info.bestblockhash}</p>
                        <p><strong>Difficulty:</strong> {info.difficulty}</p>
                        <p><strong>Median Time:</strong> {new Date(info.mediantime * 1000).toLocaleString()}</p>
                        <p><strong>Verification Progress:</strong> {(info.verificationprogress * 100).toFixed(2)}%</p>
                        <p><strong>Initial Block Download:</strong> {info.initialblockdownload ? 'Yes' : 'No'}</p>
                        <p><strong>Chain Work:</strong> {info.chainwork}</p>
                        <p><strong>Size on Disk:</strong> {(info.size_on_disk / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
                        <p><strong>Pruned:</strong> {info.pruned ? 'Yes' : 'No'}</p>
                        {info.warnings && <p><strong>Warnings:</strong> {info.warnings}</p>}
                    </div>
                )}
                <Button onClick={fetchBitcoinInfo} className="mt-4">Refresh</Button>
            </CardContent>
        </Card>
    )
}