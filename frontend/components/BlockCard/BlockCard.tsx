import {Block} from "@/components/BlockCard/blockCard.types";
import {Card, CardContent} from "@/components/ui/card";


export default function BlockCard({ block } : { block: Block }) {

    return (
        <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Height</p>
                    <p className="text-2xl font-bold">{block.height}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{block.transactions}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Hash</p>
                    <p className="text-sm font-mono break-all">{block.hash}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Time</p>
                    <p className="text-sm">{new Date(block.time * 1000).toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    )
}