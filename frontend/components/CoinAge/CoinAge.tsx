import { Card, CardContent } from "@/components/ui/card"
import { Clock, Blocks, Calendar } from "lucide-react"

interface CoinAgeProps {
    hashid: string;
    coin_creation_block: number;
    current_block: number;
    age_in_blocks: number;
    age_in_days: number;
}

export default function CoinAge({ hashid, coin_creation_block, current_block, age_in_blocks, age_in_days }: CoinAgeProps) {
    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Blocks className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Creation Block</span>
                        </div>
                        <p className="text-2xl font-bold">{coin_creation_block}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Age in Blocks</span>
                        </div>
                        <p className="text-2xl font-bold">{age_in_blocks}</p>
                    </div>
                    <div className="col-span-2 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Age in Days</span>
                        </div>
                        <p className="text-2xl font-bold">{age_in_days.toFixed(2)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}