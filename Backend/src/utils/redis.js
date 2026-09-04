import { createClient } from "redis";

let client;
let connectPromise;
let redisAvailable = false;
let lastLoggedErrorTime = 0;

// High-speed in-memory store fallback for local development when external Redis is not running
const memoryStore = new Map();
const memoryExpiries = new Map();

const isExpired = (key) => {
  const expiry = memoryExpiries.get(key);
  if (expiry && Date.now() > expiry) {
    memoryStore.delete(key);
    memoryExpiries.delete(key);
    return true;
  }
  return false;
};

const getRedisClient = async () => {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5 && process.env.NODE_ENV !== "production") {
            return Math.min(retries * 1000, 30000);
          }
          return Math.min(retries * 500, 10000);
        },
        connectTimeout: 3000,
      },
    });

    client.on("ready", () => {
      redisAvailable = true;
      console.log("[REDIS] Connected successfully to Redis server");
    });

    client.on("end", () => {
      redisAvailable = false;
    });

    client.on("error", (error) => {
      redisAvailable = false;
      const now = Date.now();
      if (now - lastLoggedErrorTime > 60000) {
        lastLoggedErrorTime = now;
        console.log(`[REDIS] Local Dev Notice: ${error.message}. (Using high-speed in-memory cache fallback)`);
      }
    });
  }

  if (!client.isOpen && !connectPromise) {
    connectPromise = client.connect()
      .catch(() => {
        redisAvailable = false;
        return null;
      })
      .finally(() => { connectPromise = null; });
  }

  if (connectPromise) await connectPromise;
  return redisAvailable ? client : null;
};

export const redisGet = async (key) => {
  try {
    const redis = await getRedisClient();
    if (redis) return await redis.get(key);
  } catch {
    redisAvailable = false;
  }
  // In-memory fallback
  if (isExpired(key)) return null;
  return memoryStore.has(key) ? memoryStore.get(key) : null;
};

export const redisDel = async (...keys) => {
  try {
    const redis = await getRedisClient();
    if (redis && keys.length) {
      await redis.del(keys);
      return;
    }
  } catch {
    redisAvailable = false;
  }
  // In-memory fallback
  for (const k of keys) {
    memoryStore.delete(k);
    memoryExpiries.delete(k);
  }
};

export const redisEval = async (script, options) => {
  const redis = await getRedisClient();
  if (!redis) return null;
  return redis.eval(script, options);
};

export const redisSet = async (key, value, options = {}) => {
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.set(key, value, options);
      return;
    }
  } catch {
    redisAvailable = false;
  }
  // In-memory fallback
  memoryStore.set(key, String(value));
  if (options.EX) {
    memoryExpiries.set(key, Date.now() + options.EX * 1000);
  } else if (options.PX) {
    memoryExpiries.set(key, Date.now() + options.PX);
  }
};

export const redisDeletePattern = async (pattern) => {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const keys = [];
      for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) keys.push(key);
      if (keys.length) await redis.del(keys);
      return;
    }
  } catch {
    redisAvailable = false;
  }
  // In-memory fallback pattern match
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const k of memoryStore.keys()) {
    if (regex.test(k)) {
      memoryStore.delete(k);
      memoryExpiries.delete(k);
    }
  }
};

export const redisIncrement = async (key, ttlSeconds = 3600) => {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      return count;
    }
  } catch {
    redisAvailable = false;
  }
  // In-memory fallback
  if (isExpired(key)) memoryStore.delete(key);
  const current = Number(memoryStore.get(key) || 0) + 1;
  memoryStore.set(key, String(current));
  if (current === 1) {
    memoryExpiries.set(key, Date.now() + ttlSeconds * 1000);
  }
  return current;
};
