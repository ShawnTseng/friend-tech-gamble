import { base } from "viem/chains";
import { base as baseType } from "wagmi/chains";
import { GetBlockParameters, HttpTransport, PublicClient, createPublicClient, http } from "viem";
import Redis from "ioredis";
import constants from "./utils/constants";

export default class Keeper {
    // Redis cache
    private redis: Redis;
    // RPC client
    rpc: PublicClient<HttpTransport, typeof baseType>;

    constructor(rpcUrl: string, redisUrl: string) {
        this.redis = new Redis(redisUrl);
        this.rpc = createPublicClient({
            chain: base,
            transport: http(rpcUrl),
        });
    }

    async getChainBlock() {
        try {
            const data = await this.rpc.getBlockNumber();
            return Number(data);
        } catch {
            console.error("Failed to collect chain head number");
            return -1;
        }
    }

    async getSyncedBlock() {
        const value = await this.redis.get("synced_block");

        return value ? Number(value) : constants.CONTRACT_DEPLOY_BLOCK - 1;
    }

    /**
     * Syncs trades between a certain range of blocks
     * @param {number} startBlock beginning index
     * @param {number} endBlock ending index
     */
    async syncTradeRange(startBlock: number, endBlock: number): Promise<void> {
        // Create block + transaction collection requests
        const numBlocks = endBlock - startBlock;

        this.rpc.getBlock()

        const requests = [];
        for (let i = startBlock; i < endBlock; i++) {
            const data = this.rpc.getBlock({
                blockNumber: BigInt(i)
            })
            requests.push(data);
        }

        const data = await Promise.all(requests);

        console.log(data);
        // // Create batch requests array
        // const requests = new Array(numBlocks).fill(0).map((_, i: number) => (
        //     this.rpc.getBlock({ blockHash: `0x${(startBlock + i).toString(16)}` })
        //     // {
        //     //     method: "eth_getBlockByNumber",
        //     //         // Hex block number, true => return all transactions
        //     //         params: [`0x${(startBlock + i).toString(16)}`, true],
        //     //             id: i,
        //     //                 jsonrpc: "2.0",
        //     // }));

        //     // this.rpc.getBlock({
        //     //     blockHash:
        //     // }
        // ));

        // // Execute request
        // const {
        //     data,
        // }: {
        //     data: {
        //         result: {
        //             number: string;
        //             timestamp: string;
        //             transactions: {
        //                 hash: string;
        //                 to: string;
        //                 from: string;
        //                 input: string;
        //             }[];
        //         };
        //     }[];
        // } = await this.rpc.post("/", requests);

        // // Setup contract
        // const contractAddress: string = constants.CONTRACT_ADDRESS.toLowerCase();
        // const contractSignatures: string[] = [
        //     constants.SIGNATURES.BUY,
        //     constants.SIGNATURES.SELL,
        // ];

        // // Filter for transactions that are either BUY or SELL to Friend.tech contract
        // let txs: {
        //     hash: string;
        //     timestamp: number;
        //     blockNumber: number;
        //     from: string;
        //     subject: string;
        //     amount: number;
        // }[] = [];
        // for (const block of data) {
        //     // For each transaction in block
        //     for (const tx of block.result.transactions) {
        //         if (
        //             // If transaction is to contract
        //             tx.to === contractAddress &&
        //             // And, transaction is of format buyShares or sellShares
        //             contractSignatures.includes(tx.input.slice(0, 10))
        //         ) {
        //             // Decode tx input
        //             const result = ethers.utils.defaultAbiCoder.decode(
        //                 ["address", "uint256"],
        //                 ethers.utils.hexDataSlice(tx.input, 4)
        //             );

        //             // Collect params and create tx
        //             const amount: number = result[1].toNumber();
        //             const direction: 1 | -1 =
        //                 tx.input.slice(0, 10) === constants.SIGNATURES.BUY ? 1 : -1;

        //             txs.push({
        //                 hash: tx.hash,
        //                 timestamp: Number(block.result.timestamp),
        //                 blockNumber: Number(block.result.number),
        //                 from: tx.from.toLowerCase(),
        //                 subject: result[0].toLowerCase(),
        //                 amount: amount * direction,
        //             });
        //         }
        //     }
        // }

        // logger.info(`Found ${txs.length} transactions`);
        // console.log(txs);

        // // Update latest synced block
        // const ok = await this.redis.set("synced_block", endBlock);
        // if (!ok) {
        //     logger.error("Error storing synced_block in cache");
        //     throw new Error("Could not synced_block store in Redis");
    }

    async syncTrades() {
        const latestChainBlock = await this.getChainBlock();
        const latestSyncedBlock = await this.getSyncedBlock();
        console.log(`latestChainBlock: ${latestChainBlock}\n latestSyncedBlock: ${latestSyncedBlock}`);

        // Calculate remaining blocks to sync
        const diffSync = latestChainBlock - latestSyncedBlock;

        if (diffSync > 0) {
            // Max 100 blocks to collect
            const numToSync = Math.min(diffSync, 100);

            // (Start, End) sync blocks
            let startBlock = latestSyncedBlock;
            let endBlock = latestSyncedBlock + numToSync;

            // Sync between block ranges
            try {
                // Sync start -> end blocks
                await this.syncTradeRange(startBlock, endBlock);
                // Recursively resync if diffSync > 0 TODO:open
                // await this.syncTrades();
            } catch (e) {
                throw new Error("Error when syncing between range");
            }
        }
    }

    async sync() {
        await this.syncTrades();

        // recollect in 5s
        // setTimeout(() => {
        //     this.sync();
        // }, 1000 * 5);
    }
}