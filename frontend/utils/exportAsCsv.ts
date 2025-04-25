import {satoshisToBTC} from "@/utils/formatters";
import {getWalletAmount} from "@/utils/transactionValueFetcher";
import {CurrentPrice} from "@/types/currentPrice.types";
import {CoinAgeResponse} from "@/types/coinAgeData.types";
import {HistoricalPrice} from "@/types/historicalPrice.types";
import {WalletData} from "@/types/wallet.types";

export const exportToCSV = (
    data: WalletData,
    priceData?: HistoricalPrice | undefined,
    coinAgeData?: CoinAgeResponse | null,
    currentPrice?: CurrentPrice | undefined,
    historicalPrices?: { [key: string]: HistoricalPrice },
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

    const blockToTimestampMap: Record<number, number> = {};
    data.transactions.forEach(tx => {
        if (tx.status?.block_height && tx.status?.block_time) {
            blockToTimestampMap[tx.status.block_height] = tx.status.block_time;
        }
    });

    // Format transactions data into rows
    const rows = data.transactions.map(tx => {
        const timestamp = tx.status?.block_time?.toString();
        const btcAmount = satoshisToBTC(getWalletAmount(tx, data.address.toString())) || 0;

        // Initialize heldFor for THIS transaction (move it inside the map function)
        let heldFor = '';

        // Get the price for this transaction from historicalPrices object
        const price = timestamp && historicalPrices?.[timestamp]?.prices?.[0]?.USD ||
            (timestamp ? historicalPrices?.[parseInt(timestamp)]?.prices?.[0]?.USD : undefined);

        const valueUSD = price !== undefined ? (Number(btcAmount) * price).toFixed(2) : '';


        // Find matching coin age detail to calculate gains if available
        const coinAgeDetail = coinAgeData?.coin_age_details?.find(detail => detail.txid === tx.txid);
        const gains = '';


        if (coinAgeDetail) {
            // Following PriceBasedGainCalculator.tsx approach but with decimal precision
            const receivedTimestamp = blockToTimestampMap?.[coinAgeDetail.received_block] ||
                (coinAgeDetail.received_block * 600 + 1230768000);

            const spentTimestamp = blockToTimestampMap?.[coinAgeDetail.spent_block] ||
                (coinAgeDetail.spent_block * 600 + 1230768000);

            if (receivedTimestamp && spentTimestamp) {
                // Calculate time difference in milliseconds
                const receivedDate = new Date(receivedTimestamp * 1000);
                const spentDate = new Date(spentTimestamp * 1000);

                // Calculate difference in milliseconds and convert to days with decimal precision
                const diffMs = spentDate.getTime() - receivedDate.getTime();
                const days = diffMs / (1000 * 60 * 60 * 24); // Keep the decimal part

                // Format with 2 decimal places
                heldFor = `${days.toFixed(2)} days`;
            }
        }


        return [
            tx.txid,
            tx.status?.block_time ? new Date(tx.status.block_time * 1000).toLocaleString() : '',
            tx.vin.length,
            tx.vout.length,
            tx.fee,
            tx.size,
            btcAmount,
            price ? price.toFixed(2) : '',
            valueUSD,
            heldFor,
            gains
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