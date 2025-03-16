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
