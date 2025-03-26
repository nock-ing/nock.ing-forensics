export function calculateRealizedGain(
    amount: number,
    acquisitionPriceUSD: number,
    sellingPriceUSD: number
): {
    realizedGain: number;
    percentageGain: number;
} {
    const acquisitionValue = acquisitionPriceUSD * amount;
    const sellingValue = sellingPriceUSD * amount;
    const realizedGain = sellingValue - acquisitionValue;
    const percentageGain = (realizedGain / acquisitionValue) * 100;

    return {
        realizedGain,
        percentageGain
    };
}