import ApiError from "../utils/ApiError.js";
import { redisEval } from "../utils/redis.js";

const localWindows = new Map();
const localFailures = new Map();
const WINDOW_SCRIPT = `
local now = tonumber(ARGV[1])
local windowStart = now - tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, windowStart)
local count = redis.call('ZCARD', KEYS[1])
if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  return { count, oldest[2] or now, 0 }
end
redis.call('ZADD', KEYS[1], now, ARGV[4])
redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[2]))
return { count + 1, now, 1 }
`;

const getClientIp = (req) => req.ip || req.socket.remoteAddress || "unknown";
const getBypass = (req) => {
  const apiKey = req.header("X-API-Key");
  const trustedKeys = (process.env.TRUSTED_API_KEYS || "").split(",").map((key) => key.trim()).filter(Boolean);
  const monitorIps = (process.env.MONITORING_IPS || "").split(",").map((ip) => ip.trim()).filter(Boolean);
  return trustedKeys.includes(apiKey) || monitorIps.includes(getClientIp(req));
};

const localConsume = (key, limit, windowMs) => {
  const now = Date.now();
  const current = localWindows.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    localWindows.set(key, next);
    return next;
  }
  current.count += 1;
  return current;
};

const isRateLimitDisabled = () => {
  return (
    process.env.DISABLE_RATE_LIMIT === "true" ||
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV !== "production"
  );
};

export const rateLimit = ({ name, limit, windowMs, key = getClientIp, trustedLimit = limit * 10 }) => async (req, res, next) => {
  // Completely bypass rate limits in development mode
  if (isRateLimitDisabled() || getBypass(req)) {
    res.set("X-RateLimit-Limit", "unlimited");
    res.set("X-RateLimit-Remaining", "unlimited");
    return next();
  }

  const identifier = key(req);
  const redisKey = `ratelimit:${name}:${identifier}`;
  let result;
  try {
    result = await redisEval(WINDOW_SCRIPT, {
      keys: [redisKey],
      arguments: [String(Date.now()), String(windowMs), String(limit), `${Date.now()}-${Math.random()}`],
    });
  } catch (error) {
    console.error("[RATELIMIT] Redis unavailable, using local fallback:", error.message);
  }

  const now = Date.now();
  const count = result ? Number(result[0]) : localConsume(redisKey, limit, windowMs).count;
  const resetAt = result ? now + windowMs : localWindows.get(redisKey).resetAt;
  const remaining = Math.max(0, limit - count);
  res.set({
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  });

  if ((result && Number(result[2]) !== 1) || (!result && count >= limit)) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfter));
    console.warn(`[RATELIMIT] blocked name=${name} ip=${getClientIp(req)}`);
    return next(new ApiError(429, `Too many requests. Please retry after ${retryAfter} seconds.`));
  }
  next();
};

export const userRateLimit = (options) => rateLimit({
  ...options,
  key: (req) => String(req.user?._id || getClientIp(req)),
});

export const adminIpGuard = (req, res, next) => {
  const whitelist = (process.env.ADMIN_IP_WHITELIST || "").split(",").map((ip) => ip.trim()).filter(Boolean);
  if (whitelist.length && !whitelist.includes(getClientIp(req))) {
    return next(new ApiError(403, "Admin access is restricted from this network"));
  }
  next();
};

export const isAccountLocked = (email) => {
  if (isRateLimitDisabled()) return false;
  const entry = localFailures.get(email);
  return entry && entry.lockedUntil > Date.now();
};

export const recordFailedLogin = (email) => {
  const current = localFailures.get(email) || { count: 0, lockedUntil: 0 };
  current.count += 1;
  if (current.count >= 10) current.lockedUntil = Date.now() + 15 * 60 * 1000;
  localFailures.set(email, current);
  return current;
};

export const clearFailedLogins = (email) => localFailures.delete(email);
