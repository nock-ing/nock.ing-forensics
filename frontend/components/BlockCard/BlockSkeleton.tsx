import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BlockSkeleton() {
    return (
        <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4">
                <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="col-span-2">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-2">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </CardContent>
        </Card>
    );
}

