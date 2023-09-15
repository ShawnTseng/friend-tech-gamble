import { base } from "viem/chains";
import { base as baseType } from "wagmi/chains";
import { HttpTransport, PublicClient, createPublicClient, http } from "viem";
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

    // async getLatestBaseBlock(): Promise<bigint> {
    //     return await this.rpc.getBlockNumber();
    // }

    async getChainBlock() {
        try {
            const data = await this.rpc.getBlockNumber();
            return Number(data);
        } catch {
            console.error("Failed to collect chain head number");
        }
    }

    async getSyncedBlock() {
        const value = await this.redis.get("synced_block");

        return value ? Number(value) : constants.CONTRACT_DEPLOY_BLOCK - 1;
    }

    async syncTrades() {
        const latestChainBlock = await this.getChainBlock();
        const latestSyncedBlock = await this.getSyncedBlock();
        console.log(`latestChainBlock: ${latestChainBlock}\n latestSyncedBlock: ${latestSyncedBlock}`);
    }

    async sync() {
        await this.syncTrades();

        // recollect in 5s
        // setTimeout(() => {
        //     this.sync();
        // }, 1000 * 5);
    }
}