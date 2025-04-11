import { getWalletAmount } from "@/utils/transactionValueFetcher";
import { WalletTxData } from "@/types/wallet.types";
import { satoshisToBTC } from "@/utils/formatters";
import {HistoricalPrice} from "@/types/historicalPrice.types";
import {CoinAgeResponse} from "@/types/coinAgeData.types";
import {CurrentPrice} from "@/types/currentPrice.types";
import React from "react";
import {calculateRealizedGain} from "@/utils/calculateRealizedGain";
import {useHistoricalPrices} from "@/hooks/useHistoricalPrices";

type HistoricalPriceData = {
    [timestamp: string]: {
        price: number;
    };
};

type CoinAgeData = {
    coin_age_details?: Array<{
        txid: string;
        age: string;
    }>;
};

export const exportToCSV = (
    data: WalletTxData,
    priceData?: HistoricalPrice | undefined,
    coinAgeData?: CoinAgeResponse | null,
    currentPrice?: CurrentPrice | undefined,
    isRealized: boolean = true
) => {
    const headers = [
        "Transaction ID",
        "Date",
        "Inputs",
        "Outputs",
        "Fee (sats)",
        "Size",
        "BTC Amount",
        "BTC Price (USD)",
        "Value (USD)",
        "Held for",
        "Gains"
    ];
    const blockToTimestampMap = React.useMemo(() => {
        const map: Record<number, number> = {};

        // Populate map from transaction data
        data.transactions.forEach(tx => {
            if (tx.status?.block_height && tx.status?.block_time) {
                map[tx.status.block_height] = tx.status.block_time;
            }
        });

        return map;
    }, [data]);


    let receivedTimestamp;
    let spentTimestamp;
    let realizedGain: { realizedGain: number; percentageGain: number };
    coinAgeData?.coin_age_details.map(detail => {
        receivedTimestamp = blockToTimestampMap?.[detail.received_block] ||
            (detail.received_block * 600 + 1230768000).toString();
        spentTimestamp = blockToTimestampMap?.[detail.spent_block] ||
            (detail.spent_block * 600 + 1230768000).toString();
        const {priceData: receivedPriceData} = useHistoricalPrices(receivedTimestamp?.toString());
        const {priceData: spentPriceData} = isRealized
            // eslint-disable-next-line react-hooks/rules-of-hooks
            ? useHistoricalPrices(spentTimestamp?.toString())
            : {priceData: null};

        if (receivedPriceData?.prices &&
            receivedPriceData.prices.length > 0 &&
            detail.amount) {

            const acquisitionPrice = receivedPriceData.prices[0].EUR;
            let sellingPrice;

            if (isRealized && spentPriceData?.prices && spentPriceData.prices.length > 0) {
                // Use historical selling price for realized gains
                sellingPrice = spentPriceData.prices[0].EUR;
            } else {
                // Use current price for unrealized gains
                sellingPrice = currentPrice?.EUR;

            }


            if (acquisitionPrice && sellingPrice) {
                realizedGain = calculateRealizedGain(acquisitionPrice, sellingPrice, detail.amount);
                console.log(realizedGain);
                return realizedGain;
            }
        }


        return null;

    });




    // Format transactions data into rows
    const rows = data.transactions.map(tx => {

        return [
            tx.txid,
            tx.status?.block_time ? new Date(tx.status.block_time * 1000).toLocaleString() : '',
            tx.vin.length,
            tx.vout.length,
            tx.fee,
            tx.size,
            satoshisToBTC(getWalletAmount(tx, data.address)) || 0,
            // Historical value at that time,
            realizedGain.realizedGain ? Math.abs(realizedGain.realizedGain).toFixed(2) : 0,


        ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wallet_transactions_${data.address}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};