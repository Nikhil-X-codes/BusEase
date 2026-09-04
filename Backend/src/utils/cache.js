import { redisDeletePattern, redisGet, redisIncrement, redisSet } from "./redis.js";

const safeKeyPart = (value) => encodeURIComponent(String(value || "").trim().toLowerCase());

export const searchCacheKey = (origin, destination, date) =>
  `cache:search:${safeKeyPart(origin)}:${safeKeyPart(destination)}:${safeKeyPart(date)}`;

export const getCached = async (key) => {
  try {
    const value = await redisGet(key);
    await redisIncrement(value ? "cache:metrics:hits" : "cache:metrics:misses");
    if (!value) return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const setCached = async (key, value, ttlSeconds = 300) => {
  try {
    return await redisSet(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    return null;
  }
};

export const invalidateSearchCache = async () => {
  try {
    return await redisDeletePattern("cache:search:*");
  } catch {
    return null;
  }
};