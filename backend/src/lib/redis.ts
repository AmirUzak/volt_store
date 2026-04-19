import { createClient, RedisClientType } from "redis";

const redisUrl = process.env.REDIS_URL;

let redisClient: RedisClientType | null = null;
let redisConnectPromise: Promise<RedisClientType> | null = null;

export const getRedisClient = async () => {
  if (!redisUrl) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on("error", (error) => {
      // eslint-disable-next-line no-console
      console.warn("Redis client error", error);
    });
  }

  if (!redisClient.isOpen) {
    redisConnectPromise ??= redisClient.connect();
    try {
      await redisConnectPromise;
    } finally {
      redisConnectPromise = null;
    }
  }

  return redisClient;
};
