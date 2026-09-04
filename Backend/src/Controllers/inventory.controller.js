import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bus from "../models/Bus.model.js";
import { ensureInventory, startOfUtcDay } from "../utils/tripInventory.js";
import { isValidObjectId, parseDate } from "../utils/validation.js";
import { holdSeats, releaseSeats, getHeldSeatsMap } from "../utils/seatHold.js";

import Payment from "../models/Payment.model.js";

export const getTripInventory = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  const { busId } = req.params;
  const travelDate = parseDate(req.query.date);
  if (!isValidObjectId(busId)) throw new ApiError(400, "Invalid bus ID");
  if (!travelDate) throw new ApiError(400, "A valid travel date is required");

  const bus = await Bus.findById(busId).select("Seats").lean();
  if (!bus) throw new ApiError(404, "Bus not found");

  const currentUserId = req.user?._id ? String(req.user._id) : null;
  const inventory = await ensureInventory(bus, travelDate);

  // Cross-reference ALL confirmed bookings for this bus (irrespective of date)
  const confirmedPayments = await Payment.find({
    bus: busId,
    status: "confirmed",
  }).select("seats").lean();

  const bookedSeatSet = new Set();
  confirmedPayments.forEach((p) => {
    (p.seats || []).forEach((s) => {
      if (s?.seatNumber) bookedSeatSet.add(String(s.seatNumber).trim().toUpperCase());
    });
  });

  // Also include any seats marked unavailable directly on the Bus document
  (bus.Seats || []).forEach((s) => {
    if (s.isAvailable === false && s.SeatNumber) {
      bookedSeatSet.add(String(s.SeatNumber).trim().toUpperCase());
    }
  });

  const seatNumbers = inventory.seats.map((s) => s.seatNumber);
  const heldMap = await getHeldSeatsMap(busId, travelDate, seatNumbers);

  const enrichedSeats = inventory.seats.map((seat) => {
    const seatNumKey = String(seat.seatNumber).trim().toUpperCase();
    const holdInfo = heldMap.get(seatNumKey);
    const isBooked = seat.isAvailable === false || bookedSeatSet.has(seatNumKey);
    const isHeldByMe = Boolean(holdInfo && currentUserId && holdInfo.userId === currentUserId);
    const isHeldByOther = Boolean(holdInfo && (!currentUserId || holdInfo.userId !== currentUserId));

    let holdStatus = "available";
    if (isBooked) {
      holdStatus = "booked";
    } else if (isHeldByMe) {
      holdStatus = "held_by_me";
    } else if (isHeldByOther) {
      holdStatus = "held";
    }

    return {
      ...seat.toObject ? seat.toObject() : seat,
      isAvailable: !isBooked && !isHeldByOther,
      holdStatus,
      heldUntil: holdInfo?.expiresAt || null,
    };
  });

  res.json(new ApiResponse(200, "Trip inventory retrieved successfully", {
    busId,
    travelDate: startOfUtcDay(travelDate),
    seats: enrichedSeats,
  }));
});

export const holdSeatsController = asyncHandler(async (req, res) => {
  const { busId } = req.params;
  const { seatNumbers = [], date, selectedDate } = req.body;
  const travelDate = parseDate(date || selectedDate);
  const userId = req.user?._id;
  const username = req.user?.username || "User";

  if (!isValidObjectId(busId)) throw new ApiError(400, "Invalid bus ID");
  if (!travelDate) throw new ApiError(400, "A valid travel date is required");
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw new ApiError(400, "seatNumbers array is required");
  }

  const bus = await Bus.findById(busId).select("Seats").lean();
  if (!bus) throw new ApiError(404, "Bus not found");

  const inventory = await ensureInventory(bus, travelDate);
  const inventorySeatMap = new Map(inventory.seats.map((s) => [String(s.seatNumber).trim().toUpperCase(), s]));
  const busSeatMap = new Map((bus.Seats || []).map((s) => [String(s.SeatNumber).trim().toUpperCase(), s]));

  // Check if any confirmed booking already exists for this bus
  const confirmedForBus = await Payment.find({
    bus: busId,
    status: "confirmed",
  }).select("seats").lean();
  const confirmedSeatSet = new Set();
  confirmedForBus.forEach((p) => {
    (p.seats || []).forEach((s) => {
      if (s?.seatNumber) confirmedSeatSet.add(String(s.seatNumber).trim().toUpperCase());
    });
  });

  // Check if already permanently booked
  for (const num of seatNumbers) {
    const key = String(num).trim().toUpperCase();
    const seatObj = inventorySeatMap.get(key);
    const busSeat = busSeatMap.get(key);
    if (!seatObj && !busSeat) {
      throw new ApiError(400, `Seat ${num} is not configured for this trip`);
    }
    if ((seatObj && seatObj.isAvailable === false) || (busSeat && busSeat.isAvailable === false) || confirmedSeatSet.has(key)) {
      throw new ApiError(409, `Seat ${num} has already been booked on this bus.`);
    }
  }

  const holdResult = await holdSeats(busId, travelDate, seatNumbers, userId, username, 300);
  if (!holdResult.success) {
    throw new ApiError(409, holdResult.message || "One or more seats are currently held by another passenger.");
  }

  res.status(200).json(new ApiResponse(200, "Seats held successfully", holdResult));
});

export const releaseSeatsController = asyncHandler(async (req, res) => {
  const { busId } = req.params;
  const { seatNumbers = [], date, selectedDate } = req.body;
  const travelDate = parseDate(date || selectedDate);
  const userId = req.user?._id;

  if (!isValidObjectId(busId)) throw new ApiError(400, "Invalid bus ID");
  if (!travelDate) throw new ApiError(400, "A valid travel date is required");

  await releaseSeats(busId, travelDate, seatNumbers, userId);
  res.status(200).json(new ApiResponse(200, "Seats released successfully", { releasedSeats: seatNumbers }));
});
