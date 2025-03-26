"use client";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ArrowRight} from "lucide-react";
import {formatAddress, formatBTC, satoshisToBTC} from "@/utils/formatters";
import {MempoolTransaction} from "@/types/transactions.types";
import Link from "next/link";

export function TransactionFlow({txData}: { txData: MempoolTransaction }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction Flow</CardTitle>
            </CardHeader>
            <CardContent className={"flex items-center justify-between"}>
                <div className="flex space-y-4 w-full items-center">
                    {/* Inputs Section */}
                    <div className="flex flex-col space-y-2">
                        <h4 className="text-md font-medium">Inputs</h4>
                        {txData.vin.map((input, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                                <span className="font-medium">
                        {input.prevout ? (
                            <Link href={`/forensics?input=${input.prevout.scriptpubkey_address}&isTxid=false`}>
                                {formatAddress(input.prevout.scriptpubkey_address)}
                            </Link>
                        ) : (
                            'Prevout not part of the given Txid'
                        )}
                                </span>
                                <span className="text-muted-foreground">
                                    {input.prevout ? formatBTC(input.prevout.value / 100000000) : 'Prevout not part of the given Txid'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <ArrowRight className="h-6 w-6 mx-auto"/>

                    {/* Outputs Section */}
                    <div className="flex flex-col space-y-2">
                        <h4 className="text-md font-medium">Outputs</h4>
                        {txData.vout?.map((output, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                                <span className="font-medium">
                                    {output.scriptpubkey_address ? (
                                        <Link href={`/forensics?input=${output.scriptpubkey_address}&isTxid=false`}>
                                            {formatAddress(output.scriptpubkey_address)}
                                        </Link>
                                    ) : 'No output address found'}
                                </span>
                                <span className="text-muted-foreground">
                                    {satoshisToBTC(output.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
