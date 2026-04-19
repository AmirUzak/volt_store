import { NextFunction, Request, Response, Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { getRedisClient } from "../lib/redis";

const router = Router();

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 30;
const buckets = new Map<string, { count: number; windowStart: number }>();

const getRateLimitKey = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";

const chatRateLimitFallback = (req: Request, res: Response, next: NextFunction) => {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now - current.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    next();
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    const retryInSec = Math.ceil((WINDOW_MS - (now - current.windowStart)) / 1000);
    res.setHeader("Retry-After", String(retryInSec));
    res.status(429).json({ message: "Too many chat requests. Please try again later." });
    return;
  }

  current.count += 1;
  buckets.set(key, current);
  next();
};

const chatRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const redisClient = await getRedisClient().catch(() => null);

  if (!redisClient) {
    chatRateLimitFallback(req, res, next);
    return;
  }

  const key = req.ip || req.socket.remoteAddress || "unknown";
  const redisKey = `chat:rate-limit:${key}`;

  try {
    const current = await redisClient.incr(redisKey);

    if (current === 1) {
      await redisClient.expire(redisKey, Math.ceil(WINDOW_MS / 1000));
    }

    if (current > MAX_REQUESTS) {
      const ttl = await redisClient.ttl(redisKey);
      if (ttl > 0) {
        res.setHeader("Retry-After", String(ttl));
      }

      res.status(429).json({ message: "Too many chat requests. Please try again later." });
      return;
    }

    next();
  } catch {
    chatRateLimitFallback(req, res, next);
  }
};

router.post("/", chatRateLimit, ChatController.chat);

export default router;
