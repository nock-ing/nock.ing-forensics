"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { type MempoolTransaction, Transaction } from "@/types/transactions.types"
import { formatAddress, formatBTC, getConfirmationStatus } from "@/utils/formatters"

export function TransactionDetails({ txData }: { txData: Transaction }) {


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5" />
                        <span>{formatAddress(txData.txid)}</span>
                    </div>
                    <Badge
                        variant={
                            "confirmations" in txData
                                ? txData.confirmations >= 6
                                    ? "default"
                                    : "secondary"
                                : (txData as MempoolTransaction).status?.confirmed
                                    ? "default"
                                    : "secondary"
                        }
                    >
                        {"confirmations" in txData
                            ? getConfirmationStatus(txData.confirmations)
                            : (txData as MempoolTransaction).status?.confirmed
                                ? "Confirmed"
                                : "Unconfirmed"}
                    </Badge>
                </CardTitle>
                <CardDescription className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
            {"time" in txData
                ? new Date(txData.time * 1000).toLocaleString()
                : (txData as MempoolTransaction).status?.block_time
                    ? new Date((txData as MempoolTransaction).status.block_time * 1000).toLocaleString()
                    : "Time not available"}
          </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Transaction Details</h3>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Version</TableCell>
                                    <TableCell>{txData.version}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Size</TableCell>
                                    <TableCell>{txData.size} bytes</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Virtual Size</TableCell>
                                    <TableCell>{txData.vsize} vbytes</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Weight</TableCell>
                                    <TableCell>{txData.weight} weight units</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Locktime</TableCell>
                                    <TableCell>{txData.locktime}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Block Hash</TableCell>
                                    <TableCell>
                                        {formatAddress("blockhash" in txData
                                            ? txData.blockhash
                                            : (txData as MempoolTransaction).status?.block_hash || "Block hash not available")}
                                    </TableCell>
                                </TableRow>
                                {"fee" in txData && (
                                    <TableRow>
                                        <TableCell className="font-medium">Fee</TableCell>
                                        <TableCell>{formatBTC((txData.fee as number) / 100000000)}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Summary</h3>
                        <p>Number of inputs: {txData.vin?.length}</p>
                        <p>Number of outputs: {txData.vout?.length}</p>
                        <p>
                            Total output value:{" "}
                            {formatBTC(txData.vout?.reduce((sum, output) => sum + ("value" in output ? output.value : 0), 0))}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

