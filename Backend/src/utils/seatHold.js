import { redisDel, redisGet, redisSet, redisDeletePattern } from "./redis.js";
import { startOfUtcDay } from "./tripInventory.js";

const DEFAULT_HOLD_TTL_SECONDS = 300; // 5 minutes hold

const getHoldKey = (busId, travelDate, seatNumber) => {
  const dateStr = startOfUtcDay(travelDate).toISOString().slice(0, 10);
  return `hold:seat:${String(busId)}:${dateStr}:${String(seatNumber).trim().toUpperCase()}`;
};

const getHoldPattern = (busId, travelDate) => {
  const dateStr = startOfUtcDay(travelDate).toISOString().slice(0, 10);
  return `hold:seat:${String(busId)}:${dateStr}:*`;
};

/**
 * Attempt to hold one or more seats for a user
 * @param {string} busId
 * @param {Date|string} travelDate
 * @param {string[]} seatNumbers
 * @param {string} userId
 * @param {string} username
 * @param {number} [ttlSeconds=300]
 * @returns {Promise<{ success: boolean, conflictingSeats?: string[], heldSeats?: string[], expiresAt?: number, message?: string }>}
 */
export const holdSeats = async (busId, travelDate, seatNumbers, userId, username = "User", ttlSeconds = DEFAULT_HOLD_TTL_SECONDS) => {
  if (!seatNumbers || !seatNumbers.length) {
    return { success: true, heldSeats: [] };
  }

  const conflictingSeats = [];
  const normalizedSeats = seatNumbers.map((s) => String(s).trim().toUpperCase());

  // 1. Check if any seat is already held by someone else
  for (const seatNumber of normalizedSeats) {
    const key = getHoldKey(busId, travelDate, seatNumber);
    const existingHoldRaw = await redisGet(key);
    if (existingHoldRaw) {
      try {
        const existingHold = JSON.parse(existingHoldRaw);
        // If held by another user and not expired
        if (existingHold.userId && String(existingHold.userId) !== String(userId)) {
          conflictingSeats.push(seatNumber);
        }
      } catch {
        // Corrupted hold entry, ignore
      }
    }
  }

  if (conflictingSeats.length > 0) {
    return {
      success: false,
      conflictingSeats,
      message: `Seat(s) ${conflictingSeats.join(", ")} are currently selected/held by another passenger.`,
    };
  }

  // 2. Place hold on all requested seats
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const holdData = JSON.stringify({
    userId: String(userId),
    username,
    busId: String(busId),
    seatNumbers: normalizedSeats,
    expiresAt,
  });

  for (const seatNumber of normalizedSeats) {
    const key = getHoldKey(busId, travelDate, seatNumber);
    await redisSet(key, holdData, { EX: ttlSeconds });
  }

  return {
    success: true,
    heldSeats: normalizedSeats,
    expiresAt,
  };
};

/**
 * Release holds for one or more seats if they belong to the user
 * @param {string} busId
 * @param {Date|string} travelDate
 * @param {string[]} seatNumbers
 * @param {string} userId
 */
export const releaseSeats = async (busId, travelDate, seatNumbers, userId) => {
  if (!seatNumbers || !seatNumbers.length) return;
  const normalizedSeats = seatNumbers.map((s) => String(s).trim().toUpperCase());

  for (const seatNumber of normalizedSeats) {
    const key = getHoldKey(busId, travelDate, seatNumber);
    const existingHoldRaw = await redisGet(key);
    if (existingHoldRaw) {
      try {
        const existingHold = JSON.parse(existingHoldRaw);
        // Only release if held by this user or if no userId specified
        if (!userId || String(existingHold.userId) === String(userId)) {
          await redisDel(key);
        }
      } catch {
        await redisDel(key);
      }
    }
  }
};

/**
 * Clear seat holds completely upon successful booking
 * @param {string} busId
 * @param {Date|string} travelDate
 * @param {string[]} seatNumbers
 */
export const clearSeatHolds = async (busId, travelDate, seatNumbers) => {
  if (!seatNumbers || !seatNumbers.length) return;
  const normalizedSeats = seatNumbers.map((s) => String(s).trim().toUpperCase());
  for (const seatNumber of normalizedSeats) {
    const key = getHoldKey(busId, travelDate, seatNumber);
    await redisDel(key);
  }
};

/**
 * Get map of all currently held seats for a given bus and travel date
 * @param {string} busId
 * @param {Date|string} travelDate
 * @param {string[]} [seatNumbers]
 * @returns {Promise<Map<string, { userId: string, username: string, expiresAt: number }>>}
 */
export const getHeldSeatsMap = async (busId, travelDate, seatNumbers = []) => {
  const heldMap = new Map();
  if (!seatNumbers || !seatNumbers.length) return heldMap;

  for (const seatNumber of seatNumbers) {
    const key = getHoldKey(busId, travelDate, seatNumber);
    const holdRaw = await redisGet(key);
    if (holdRaw) {
      try {
        const holdData = JSON.parse(holdRaw);
        if (holdData && (!holdData.expiresAt || holdData.expiresAt > Date.now())) {
          heldMap.set(String(seatNumber).trim().toUpperCase(), holdData);
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return heldMap;
};
