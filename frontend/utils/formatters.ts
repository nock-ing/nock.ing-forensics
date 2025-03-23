export const formatBTC = (amount: number): string => {
    return amount.toFixed(8) + " BTC"
}

export const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
}

export const getConfirmationStatus = (confirmations: number | undefined): string => {
    if (confirmations === undefined) return "Unknown"
    if (confirmations === 0) return "Unconfirmed"
    if (confirmations < 6) return "Pending"
    return "Confirmed"
}

export const satoshisToBTC = (satoshis: number): string => {
    return (satoshis / 1e8).toFixed(8) + " BTC"
}

export const convertIsoDateToLocaleString = (isoDate: string): string => {
    // remove microseconds
    const safeDate = isoDate.split('.')[0];
    return new Date(safeDate).toLocaleString();
};

export const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString() + ' ' +
        new Date(timestamp * 1000).toLocaleTimeString();
};

