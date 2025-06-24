import {RelatedTransaction} from "@/components/RelatedTransactions/relatedTransactions.types";
import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ChevronDown, ChevronUp, Clock, Hash} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {Button} from "@/components/ui/button";
import Link from "next/link";

export default function TransactionCard({ transaction }: { transaction: RelatedTransaction }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const formatBTC = (amount: number) => {
        return amount.toFixed(8) + " BTC"
    }

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-6)}`
    }

    const getConfirmationStatus = (confirmations: number) => {
        if (confirmations === 0) return "Unconfirmed"
        if (confirmations < 6) return "Pending"
        return "Confirmed"
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5" />
                        <span>{formatAddress(transaction.txid)}</span>
                    </div>
                    <Badge variant={transaction.details.confirmations >= 6 ? "default" : "secondary"}>
                        {getConfirmationStatus(transaction.details.confirmations)}
                    </Badge>
                </CardTitle>
                <CardDescription className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(transaction.details.time * 1000).toLocaleString()}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Inputs</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Output Index</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transaction.details.vin.map((input, index) => (
                                    <TableRow key={index}>
                                        <Link href={`/forensics?input=${input.txid}&isTxid=true`}><TableCell>{formatAddress(input.txid)}</TableCell></Link>
                                        <TableCell>{input.vout}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Outputs</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transaction.details.vout.map((output, index) => (
                                    <TableRow key={index}>
                                        <Link href={`/forensics?input=${output.scriptPubKey.address}&isTxid=false`}><TableCell>{formatAddress(output.scriptPubKey.address)}</TableCell></Link>
                                        <TableCell>{formatBTC(output.value)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full">
                                {isDetailsOpen ? (
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                )}
                                {isDetailsOpen ? "Hide Details" : "Show Details"}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                            <div className="space-y-2">
                                <p>
                                    <strong>Confirmations:</strong> {transaction.details.confirmations}
                                </p>
                                <p>
                                    <strong>Total Input:</strong>{" "}
                                    {formatBTC(
                                        transaction.details.vout.reduce((sum, output) => sum + output.value, 0)
                                    )}
                                </p>
                                <p>
                                    <strong>Total Output:</strong>{" "}
                                    {formatBTC(
                                        transaction.details.vout.reduce((sum, output) => sum + output.value, 0)
                                    )}
                                </p>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </CardContent>
        </Card>
    )
}

