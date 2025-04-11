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