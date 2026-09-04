import { createClient } from "redis";

let client;
let connectPromise;
let redisAvailable = false;
let lastLoggedErrorTime = 0;

export const getRedisClient = async () => {
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
        console.error(`[REDIS] Connection error: ${error.message}`);
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
  } catch (error) {
    redisAvailable = false;
    console.error(`[REDIS] Error getting key "${key}":`, error.message);
  }
  return null;
};

export const redisDel = async (...keys) => {
  try {
    const redis = await getRedisClient();
    if (redis && keys.length) {
      await redis.del(keys);
    }
  } catch (error) {
    redisAvailable = false;
    console.error(`[REDIS] Error deleting keys:`, error.message);
  }
};

export const redisEval = async (script, options) => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    return await redis.eval(script, options);
  } catch (error) {
    redisAvailable = false;
    console.error(`[REDIS] Error evaluating script:`, error.message);
    return null;
  }
};

export const redisSet = async (key, value, options = {}) => {
  try {
    const redis = await getRedisClient();
    if (redis) {
      return await redis.set(key, value, options);
    }
  } catch (error) {
    redisAvailable = false;
    console.error(`[REDIS] Error setting key "${key}":`, error.message);
  }
  return null;
};

export const redisDeletePattern = async (pattern) => {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const keys = [];
      for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key);
      }
      if (keys.length) await redis.del(keys);
    }
  } catch (error) {
    redisAvailable = false;
    console.error(`[REDIS] Error deleting pattern "${pattern}":`, error.message);
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
  } catch (error) {
    redisAvailable = false;
    console.error(`[REDIS] Error incrementing key "${key}":`, error.message);
  }
  return 0;
};
