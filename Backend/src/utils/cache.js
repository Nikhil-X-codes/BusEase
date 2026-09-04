import { redisDeletePattern, redisGet, redisIncrement, redisSet } from "./redis.js";

const safeKeyPart = (value) => encodeURIComponent(String(value).trim().toLowerCase());

export const searchCacheKey = (origin, destination, date) =>
  `cache:search:${safeKeyPart(origin)}:${safeKeyPart(destination)}:${date}`;

export const getCached = async (key) => {
  const value = await redisGet(key);
  await redisIncrement(value ? "cache:metrics:hits" : "cache:metrics:misses");
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const setCached = (key, value, ttlSeconds) =>
  redisSet(key, JSON.stringify(value), { EX: ttlSeconds });

export const invalidateSearchCache = () => redisDeletePattern("cache:search:*");