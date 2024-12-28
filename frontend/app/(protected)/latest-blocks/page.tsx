'use client';

import React, { useOptimistic, useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Block, BlockList } from "@/components/BlockCard/blockCard.types";
import BlockCard from "@/components/BlockCard/BlockCard";
import { useToast } from "@/hooks/use-toast";
import {BlockSkeleton} from "@/components/BlockCard/BlockSkeleton";

export default function Dashboard() {
    const [latestBlocks, setLatestBlocks] = useState<BlockList>({ latest_blocks: [] });
    const [optimisticBlocks, setOptimisticBlocks] = useOptimistic<BlockList>(latestBlocks);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchLatestBlocks = async () => {
        startTransition(() => {
            // Optimistically update with placeholder blocks
            const placeholderBlocks: Block[] = Array.from({ length: 5 }, (_, index) => ({
                height: (optimisticBlocks.latest_blocks[0]?.height || 0) + index + 1,
                hash: `Loading-${Date.now()}-${index}`,
                time: Date.now() / 1000,
                transactions: 0,
            }));
            setOptimisticBlocks((prev) => ({
                latest_blocks: [...placeholderBlocks, ...prev.latest_blocks]
            }));
        });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/latest-blocks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('response', response);
            if (!response.ok) {
                throw new Error('Failed to fetch latest blocks');
            }

            const newBlocks: BlockList = await response.json();
            startTransition(() => {
                setLatestBlocks(newBlocks);
                setOptimisticBlocks(newBlocks);
            });
        } catch (error) {
            console.error('Failed to fetch latest blocks:', error);
            startTransition(() => {
                setOptimisticBlocks(latestBlocks);
            });
            toast({
                title: "Error",
                description: "Failed to fetch latest blocks. Please try again.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchLatestBlocks();
    }, []);


    return (
        <div className="container mx-auto p-4">
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">Latest Blocks</CardTitle>
                    <Button onClick={fetchLatestBlocks} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4"/>
                        )}
                        Fetch Latest Blocks
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-200px)]">
                        {optimisticBlocks.latest_blocks.length > 0 ? (
                            <div className="space-y-4">
                                {optimisticBlocks.latest_blocks.map((block: Block) => (
                                    block.hash.startsWith('Loading-') ? (
                                        <BlockSkeleton key={block.hash} />
                                    ) : (
                                        <BlockCard key={block.hash} block={block} />
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <BlockSkeleton key={index} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

