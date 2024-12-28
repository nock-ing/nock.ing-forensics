export type Block = {
    height: number,
    hash: string,
    time: number,
    transactions: number,
}

export type BlockList = {
    latest_blocks: Block[],
}

