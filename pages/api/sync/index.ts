import { NextApiRequest, NextApiResponse } from "next";
import Keeper from "./keeper";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const execute = async () => {
      const RPC_URL: string | undefined = process.env.VITE_RPC_URL;
      const REDIS_URL: string = process.env.VITE_REDIS_URL ?? "redis://127.0.0.1:6379";
      if (!RPC_URL) {
        throw new Error("missing env vars");
      }
  
      const keeper = new Keeper(RPC_URL, REDIS_URL);
      await keeper.sync();
    }
    
    try {
     await execute().then();
     res.status(200).json({ message: 'Hello from Next.js!' })
    } catch (e) {
      console.error(e);
      res.status(500).json(e);
    }

}