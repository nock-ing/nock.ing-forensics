import { getWalletAmount } from "@/utils/transactionValueFetcher";
import { WalletTxData } from "@/types/wallet.types";
import { satoshisToBTC } from "@/utils/formatters";

export const exportToCSV = (data: WalletTxData, priceData?: Record<string, any>, coinAgeData?: Record<string, any>, currentPrice?: number) => {
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
        const btcAmount = getWalletAmount(tx, data.address);
        const txTimeStamp = tx.status?.block_time;
        const formattedBtcAmount = satoshisToBTC(btcAmount);

        // Get historical price if available
        const historicalPrice = txTimeStamp && priceData?.[txTimeStamp.toString()]?.price || '';

        // Calculate USD value
        const usdValue = historicalPrice && formattedBtcAmount ?
            (parseFloat(historicalPrice) * Math.abs(parseFloat(formattedBtcAmount))).toFixed(2) : '';

        // Get coin age/held for data if available
        const coinAge = coinAgeData?.[tx.txid]?.age || '';

        // Calculate gains
        let gains = '';
        if (currentPrice && historicalPrice && formattedBtcAmount && parseFloat(formattedBtcAmount) > 0) {
            const gainPercentage = ((currentPrice - parseFloat(historicalPrice)) / parseFloat(historicalPrice) * 100).toFixed(2);
            gains = `${gainPercentage}%`;
        }

        return [
            tx.txid,
            txTimeStamp ? new Date(txTimeStamp * 1000).toLocaleString() : '',
            tx.vin.length,
            tx.vout.length,
            tx.fee,
            tx.size,
            formattedBtcAmount,
            historicalPrice,
            usdValue,
            coinAge,
            gains
        ].join(',');
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