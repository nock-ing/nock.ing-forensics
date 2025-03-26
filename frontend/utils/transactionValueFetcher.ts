export const getWalletAmount = (tx: any, address: string) => {
    // Make sure vout exists and is an array
    const vout = Array.isArray(tx.vout) ? tx.vout : [];
    const vin = Array.isArray(tx.vin) ? tx.vin : [];

    // Find vout entries that belong to this wallet address
    const receivedOutputs = vout
        .filter((output: any) => output?.scriptpubkey_address === address)
        .reduce((sum: number, output: any) => sum + (output.value || 0), 0);

    // Find vin entries that came from this wallet address
    const sentInputs = vin
        .filter((input: any) => input?.prevout?.scriptpubkey_address === address)
        .reduce((sum: number, input: any) => sum + (input.prevout?.value || 0), 0);

    // Amount held is received - sent
    return receivedOutputs - sentInputs;
};