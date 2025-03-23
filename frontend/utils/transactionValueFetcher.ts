export const getWalletAmount = (tx: any, address: string) => {
    // Find vout entries that belong to this wallet address
    const receivedOutputs = tx.vout
        .filter((output: any) => output.scriptpubkey_address === address)
        .reduce((sum: number, output: any) => sum + output.value, 0);

    // Find vin entries that came from this wallet address
    const sentInputs = tx.vin
        .filter((input: any) => input.prevout?.scriptpubkey_address === address)
        .reduce((sum: number, input: any) => sum + input.prevout.value, 0);

    // Amount held is received - sent
    return receivedOutputs - sentInputs;
};