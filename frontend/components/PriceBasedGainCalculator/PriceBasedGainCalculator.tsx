import {useHistoricalPrices} from "@/hooks/useHistoricalPrices";
import {CoinAgeResponse} from "@/types/coinAgeData.types";
import {calculateRealizedGain} from "@/utils/calculateRealizedGain";

interface PriceBasedGainCalculatorProps {
    coinAgeDetail: CoinAgeResponse["coin_age_details"][0];
    blockToTimestampMap?: Record<number, number>;
    currentPrice?: number; // Add current price for unrealized gains
    isRealized?: boolean;  // Flag to determine if this is a realized gain
}

export default function PriceBasedGainCalculator({
                                                     coinAgeDetail,
                                                     blockToTimestampMap,
                                                     currentPrice,
                                                     isRealized = true
                                                 }: PriceBasedGainCalculatorProps) {
    const receivedTimestamp = blockToTimestampMap?.[coinAgeDetail.received_block] ||
        (coinAgeDetail.received_block * 600 + 1230768000).toString();

    const spentTimestamp = isRealized
        ? (blockToTimestampMap?.[coinAgeDetail.spent_block] ||
            (coinAgeDetail.spent_block * 600 + 1230768000).toString())
        : null;

    const {priceData: receivedPriceData} = useHistoricalPrices(receivedTimestamp?.toString());
    const {priceData: spentPriceData} = isRealized
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ? useHistoricalPrices(spentTimestamp?.toString())
        : {priceData: null};

    if (receivedPriceData?.prices &&
        receivedPriceData.prices.length > 0 &&
        coinAgeDetail.amount) {

        const acquisitionPrice = receivedPriceData.prices[0].EUR;
        let sellingPrice;

        if (isRealized && spentPriceData?.prices && spentPriceData.prices.length > 0) {
            // Use historical selling price for realized gains
            sellingPrice = spentPriceData.prices[0].EUR;
        } else {
            // Use current price for unrealized gains
            sellingPrice = currentPrice;
        }

        if (sellingPrice) {
            const {realizedGain, percentageGain} = calculateRealizedGain(
                coinAgeDetail.amount,
                acquisitionPrice,
                sellingPrice
            );

            const gainColor = realizedGain >= 0 ? "text-green-500" : "text-red-500";

            return (
                <div className="mt-1">
                    <span className={gainColor}>
                        {realizedGain > 0 ? "+" : ""}${Math.abs(realizedGain).toFixed(2)} ({percentageGain.toFixed(2)}%)
                        {!isRealized && <span className="text-xs ml-1">(unrealized)</span>}
                    </span>
                </div>
            );
        }
    }

    return null;
}