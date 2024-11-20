'use client'

import { useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

export default function AnalysisForm() {
    const [inputValue, setInputValue] = useState('')
    const [analysisResult, setAnalysisResult] = useState<unknown | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Mock analysis function - in a real app, this would call the Bitcoin RPC
        if (inputValue.length === 64) {
            // Assuming it's a transaction hash
            setAnalysisResult({
                type: 'transaction',
                txid: inputValue,
                confirmations: 1000,
                time: 1636329600,
                size: 225,
                vsize: 225,
                fee: 0.00001
            })
        } else if (!isNaN(Number(inputValue))) {
            // Assuming it's a block height
            setAnalysisResult({
                type: 'block',
                height: Number(inputValue),
                hash: '000000000000000000024bead8df69990852c202db0e0097c1a12ea637d7e96d',
                time: 1636329600,
                nonce: 1234567890,
                difficulty: 21434395961348
            })
        } else {
            setAnalysisResult({ error: 'Invalid input. Please enter a transaction hash or block height.' })
        }
    }

    return (
        <>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Bitcoin Data Analysis</CardTitle>
                    <CardDescription>Enter a transaction hash or block height to analyze</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex space-x-2">
                        <Input
                            type="text"
                            placeholder="Enter transaction hash or block height"
                            value={inputValue}
                            onChange={handleInputChange}
                            className="flex-1"
                        />
                        <Button type="submit">
                            <SearchIcon className="mr-2 h-4 w-4" />
                            Analyze
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {analysisResult && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(
                            <Table>
                                <TableBody>
                                    {Object.entries(analysisResult).map(([key, value]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium">{key}</TableCell>
                                            <TableCell>{String(value)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}
        </>
    )
}