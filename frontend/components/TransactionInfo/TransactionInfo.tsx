import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Clock, Hash} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";
import { Transaction } from "./transactions.types";


interface TransactionInfoProps {
    isTxid: boolean;
    input: string;
    transaction: Transaction | undefined;
}

const formatBTC = (amount: number) => {
    return amount.toFixed(8) + " BTC";
};

const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

const getConfirmationStatus = (confirmations: number) => {
    if (confirmations === 0) return "Unconfirmed";
    if (confirmations < 6) return "Pending";
    return "Confirmed";
};

export default function TransactionInfo({ isTxid, input, transaction }: TransactionInfoProps) {
   return (
       <Card>
           <CardHeader>
               <CardTitle className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                       <Hash className="h-5 w-5" />
                       <span>{formatAddress(input)}</span>
                   </div>
                   {isTxid && transaction && (
                       <Badge variant={transaction?.transaction.confirmations >= 6 ? "default" : "secondary"}>
                           {getConfirmationStatus(transaction?.transaction.confirmations)}
                       </Badge>
                   )}
               </CardTitle>
               <CardDescription className="flex items-center space-x-2">
                   <Clock className="h-4 w-4" />
                   {isTxid && transaction && (
                       <span>{new Date(transaction?.transaction.time * 1000).toLocaleString()}</span>
                   )}
               </CardDescription>
           </CardHeader>
           <CardContent>

               <div className="space-y-4">
                   <p className="text-sm text-muted-foreground">Type: {isTxid ? 'Transaction ID' : 'Wallet Address'}</p>
                   {isTxid && transaction && (
                       <>
                           <div>
                               <h3 className="text-lg font-semibold mb-2">Transaction Details</h3>
                               <Table>
                                   <TableBody>
                                       <TableRow>
                                           <TableCell className="font-medium">Version</TableCell>
                                           <TableCell>{transaction?.transaction.version}</TableCell>
                                       </TableRow>
                                       <TableRow>
                                           <TableCell className="font-medium">Size</TableCell>
                                           <TableCell>{transaction?.transaction.size} bytes</TableCell>
                                       </TableRow>
                                       <TableRow>
                                           <TableCell className="font-medium">Virtual Size</TableCell>
                                           <TableCell>{transaction?.transaction.vsize} vbytes</TableCell>
                                       </TableRow>
                                       <TableRow>
                                           <TableCell className="font-medium">Weight</TableCell>
                                           <TableCell>{transaction?.transaction.weight} weight units</TableCell>
                                       </TableRow>
                                       <TableRow>
                                           <TableCell className="font-medium">Locktime</TableCell>
                                           <TableCell>{transaction?.transaction.locktime}</TableCell>
                                       </TableRow>
                                       <TableRow>
                                           <TableCell className="font-medium">Block Hash</TableCell>
                                           <TableCell>{formatAddress(transaction?.transaction.blockhash)}</TableCell>
                                       </TableRow>
                                   </TableBody>
                               </Table>
                           </div>
                           <div>
                               <h3 className="text-lg font-semibold mb-2">Input Summary</h3>
                               <p>Number of inputs: {transaction?.transaction.vin.length}</p>
                           </div>
                           <div>
                               <h3 className="text-lg font-semibold mb-2">Output Summary</h3>
                               <p>Number of outputs: {transaction?.transaction.vout.length}</p>
                               <p>Total output
                                   value: {formatBTC(transaction?.transaction.vout.reduce((sum, output) => sum + output.value, 0))}</p>
                           </div>
                       </>
                   )}
               </div>
           </CardContent>
       </Card>
   )
}