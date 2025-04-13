// components/WalletActivityHeatmap/WalletActivityHeatmap.tsx
import React, {useState, useMemo} from 'react';
import {format, parseISO, startOfYear, endOfYear, eachDayOfInterval, getYear} from 'date-fns';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {cn} from '@/lib/utils';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

interface Transaction {
    timestamp: string; // ISO string format
    // other transaction properties you might have
}

interface WalletActivityHeatmapProps {
    transactions: Transaction[];
    className?: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WalletActivityHeatmap: React.FC<WalletActivityHeatmapProps> = ({transactions, className}) => {
    // Get list of available years from transactions
    const availableYears = useMemo(() => {
        const years = transactions.map(tx => getYear(parseISO(tx.timestamp)));
        return [...new Set(years)].sort((a, b) => b - a); // Sort descending
    }, [transactions]);

    // Default to most active year or current year if no transactions
    const mostActiveYear = useMemo(() => {
        if (availableYears.length === 0) return new Date().getFullYear();

        const txCountByYear: Record<number, number> = {};
        transactions.forEach(tx => {
            const year = getYear(parseISO(tx.timestamp));
            txCountByYear[year] = (txCountByYear[year] || 0) + 1;
        });

        return Object.entries(txCountByYear)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([year]) => parseInt(year))[0];
    }, [transactions, availableYears]);

    const [selectedYear, setSelectedYear] = useState<number>(mostActiveYear);

    // Generate daily activity data for the selected year
    const activityData = useMemo(() => {
        const startDate = startOfYear(new Date(selectedYear, 0, 1));
        const endDate = endOfYear(startDate);

        // Create array of all days in the year
        const allDays = eachDayOfInterval({start: startDate, end: endDate});

        // Create a map of counts by date string
        const countsByDate: Record<string, number> = {};

        // Filter transactions for selected year and count by date
        transactions
            .filter(tx => getYear(parseISO(tx.timestamp)) === selectedYear)
            .forEach(tx => {
                const dateStr = format(parseISO(tx.timestamp), 'yyyy-MM-dd');
                countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
            });

        // Max count for color scaling
        const maxCount = Math.max(1, ...Object.values(countsByDate));

        // Map all days to activity data
        return allDays.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const count = countsByDate[dateStr] || 0;
            return {
                date,
                dateStr,
                count,
                intensity: count === 0 ? 0 : Math.ceil((count / maxCount) * 4), // 0-4 intensity levels
            };
        });
    }, [transactions, selectedYear]);

    // Group activity data by week for display
    const activityByWeek = useMemo(() => {
        const weeks: typeof activityData[] = [];
        let currentWeek: typeof activityData = [];

        activityData.forEach((day, index) => {
            const dayOfWeek = day.date.getDay();

            // If it's the first day or a Sunday, start a new week
            if (index === 0 || dayOfWeek === 0) {
                if (currentWeek.length > 0) {
                    weeks.push(currentWeek);
                }

                currentWeek = [];

                // Fill in empty days at the start of the first week
                if (index === 0 && dayOfWeek !== 0) {
                    for (let i = 0; i < dayOfWeek; i++) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        currentWeek.push(null);
                    }
                }
            }

            currentWeek.push(day);

            // If it's the last day, push the final week
            if (index === activityData.length - 1) {
                weeks.push(currentWeek);
            }
        });

        return weeks;
    }, [activityData]);

    // Color mapping based on intensity level
    const getColorClass = (intensity: number): string => {
        switch (intensity) {
            case 0:
                return 'bg-gray-100 dark:bg-gray-800';
            case 1:
                return 'bg-green-100 dark:bg-green-900';
            case 2:
                return 'bg-green-300 dark:bg-green-700';
            case 3:
                return 'bg-green-500 dark:bg-green-500';
            case 4:
                return 'bg-green-700 dark:bg-green-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Transaction Activity</h3>
                <Select
                    value={String(selectedYear)}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select Year"/>
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex">
                {/* Day labels on the left */}
                <div className="flex flex-col justify-start pt-[26px] pr-2">
                    {DAY_LABELS.map((day, index) => (
                        <div key={day} className={cn(
                            "text-xs text-muted-foreground h-[11px] leading-none",
                            index === 0 && "h-[13px]",
                            "mt-[2px]"
                        )}>
                            {index % 2 === 0 ? day : ""}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col flex-1">
                    {/* Month labels on top */}
                    <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
                        {MONTH_LABELS.map(month => (
                            <div key={month} className="flex-1 text-center">{month}</div>
                        ))}
                    </div>

                    {/* Activity grid */}
                    <div className="grid grid-flow-col auto-cols-fr gap-[1px]">
                        {activityByWeek.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[1px]">
                                {week.map((day, dayIndex) => (
                                    <TooltipProvider key={dayIndex}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "h-[15px] w-[15px] rounded-sm",
                                                        day ? getColorClass(day.intensity) : "invisible"
                                                    )}
                                                />
                                            </TooltipTrigger>
                                            {day && (
                                                <TooltipContent>
                                                    <p>{day.count} transactions on {format(day.date, 'MMM d, yyyy')}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center text-xs text-muted-foreground gap-2 self-end">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(intensity => (
                    <div
                        key={intensity}
                        className={cn("h-[10px] w-[10px] rounded-sm", getColorClass(intensity))}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
};

export default WalletActivityHeatmap;