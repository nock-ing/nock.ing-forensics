"use client";
import React, {useMemo, useState} from 'react';
import {Tooltip} from '@/components/ui/tooltip';
import {TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {format, parseISO, eachDayOfInterval, startOfYear, endOfYear} from 'date-fns';

interface WalletActivityHeatmapProps {
    walletTransactions?: any; // Update with your actual type
}

const WalletActivityHeatmap: React.FC<WalletActivityHeatmapProps> = ({walletTransactions}) => {
    const activityData = useMemo(() => {
        if (!walletTransactions?.txs?.length) return {};

        // Create a map of dates to transaction counts
        const txByDate: Record<string, number> = {};

        walletTransactions.txs.forEach((tx: any) => {
            // Assuming tx has a timestamp or date field
            const date = format(new Date(tx.status.block_time * 1000), 'yyyy-MM-dd');
            txByDate[date] = (txByDate[date] || 0) + 1;
        });

        return txByDate;
    }, [walletTransactions]);

    const yearWithMostActivity = useMemo(() => {
        // Default to 2017 (or any reasonable default) rather than current year
        if (!walletTransactions?.txs?.length) {
            console.log("No transaction data available, defaulting to 2017");
            return 2017; // A reasonable default for Bitcoin transactions
        }

        console.log("Total transactions to analyze:", walletTransactions.txs.length);

        // Count transactions by year
        const txCountByYear: Record<string, number> = {};
        let validTransactionsFound = 0;

        walletTransactions.txs.forEach((tx: any, index: number) => {
            // For debugging, log a sample of transactions
            if (index < 3) {
                console.log(`Transaction ${index} sample:`, {
                    txid: tx.txid,
                    blockTime: tx.status?.block_time,
                    status: tx.status
                });
            }

            // Make sure we have the data we need
            if (!tx.status?.block_time) {
                console.warn("Transaction missing block_time:", tx);
                return;
            }

            try {
                // Explicitly convert to timestamp in milliseconds
                let timestamp: number;

                if (typeof tx.status.block_time === 'number') {
                    // Unix timestamp is typically in seconds, so convert to milliseconds
                    timestamp = tx.status.block_time * 1000;
                } else {
                    // Try parsing as string
                    timestamp = Date.parse(tx.status.block_time);
                }

                if (isNaN(timestamp)) {
                    console.warn(`Invalid timestamp for transaction ${index}:`, tx.status.block_time);
                    return;
                }

                const txDate = new Date(timestamp);
                const year = txDate.getFullYear();

                // Sanity check the year
                if (year < 2009 || year > 2024) {
                    console.warn(`Suspicious year ${year} for transaction ${index}:`, tx);
                    return;
                }

                txCountByYear[year] = (txCountByYear[year] || 0) + 1;
                validTransactionsFound++;

            } catch (error) {
                console.error(`Error processing transaction ${index}:`, error);
            }
        });

        console.log(`Found ${validTransactionsFound} valid transactions with dates`);
        console.log("Transaction counts by year:", txCountByYear);

        // Manual check if we actually found any transactions
        if (validTransactionsFound === 0) {
            console.warn("No valid transactions with dates found!");
            return 2017; // Fallback to 2017 as default
        }

        // Find the year with the most transactions
        let maxYear = 2017; // Default to 2017 instead of current year
        let maxCount = 0;

        Object.entries(txCountByYear).forEach(([yearStr, count]) => {
            const year = parseInt(yearStr);
            console.log(`Checking year ${year} with ${count} transactions`);

            if (count > maxCount) {
                maxCount = count;
                maxYear = year;
                console.log(`New max year: ${maxYear} with ${maxCount} transactions`);
            }
        });

        console.log("Final year with most activity:", maxYear, "with", maxCount, "transactions");
        return maxYear;
    }, [walletTransactions]);

    const yearDays = useMemo(() => {
        const year = yearWithMostActivity;
        const start = new Date(year, 0, 1); // January 1st of the target year
        const end = new Date(year, 11, 31); // December 31st of the target year
        return eachDayOfInterval({start, end});
    }, [yearWithMostActivity]);


    // Get max count for color scaling
    const maxCount = Math.max(...Object.values(activityData), 1);

    const getCellColor = (count: number) => {
        if (!count) return 'bg-gray-100 dark:bg-gray-800';
        const intensity = Math.min(1, count / maxCount);
        // Return progressively darker green based on intensity
        if (intensity < 0.2) return 'bg-green-100 dark:bg-green-900';
        if (intensity < 0.4) return 'bg-green-200 dark:bg-green-800';
        if (intensity < 0.6) return 'bg-green-300 dark:bg-green-700';
        if (intensity < 0.8) return 'bg-green-400 dark:bg-green-600';
        return 'bg-green-500 dark:bg-green-500';
    };

    if (!walletTransactions) {
        return <div>No transaction data available</div>;
    }

    if (!activityData) {
        return <div>No activity data available</div>;
    }


    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Transaction Activity</h3>

            <div className="flex flex-wrap gap-1">
                <TooltipProvider>
                    {yearDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const count = activityData[dateStr] || 0;

                        return (
                            <Tooltip key={dateStr}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`w-3 h-3 rounded-sm ${getCellColor(count)}`}
                                        aria-label={`${count} transactions on ${format(day, 'MMM d, yyyy')}`}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{format(day, 'MMM d, yyyy')}: {count} transactions</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>
            <div className="flex items-center text-xs gap-1">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"/>
                <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900"/>
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800"/>
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700"/>
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600"/>
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500"/>
                <span>More</span>
            </div>
        </div>
    );
};

export default WalletActivityHeatmap;