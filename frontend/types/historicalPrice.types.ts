

type ExchangeCurrencies = {
    USDAUD: number,
    USDCAD: number,
    USDCHF: number,
    USDEUR: number,
    USDGBP: number,
    USDJPY: number,
};

type ExchangePrices = {
    EUR: number,
    USD: number,
    time: number
};

export type HistoricalPrice = {
    exchangeRates: ExchangeCurrencies,
    prices: ExchangePrices[]
};