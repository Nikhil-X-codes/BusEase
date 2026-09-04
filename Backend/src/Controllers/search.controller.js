import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bus from "../models/Bus.model.js";
import Route from "../models/Routes.model.js";
import TripInventory from "../models/TripInventory.model.js";
import { cleanText, escapeRegex, parseDate } from "../utils/validation.js";
import { ensureInventory, startOfUtcDay } from "../utils/tripInventory.js";
import { getCached, searchCacheKey, setCached } from "../utils/cache.js";

export const searchBuses = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  const origin = cleanText(req.query.origin || req.query.startLocation, 100);
  const destination = cleanText(req.query.destination || req.query.endLocation, 100);
  const requestedDate = parseDate(req.query.date);

  if (!origin || !destination || !req.query.date) {
    throw new ApiError(400, "origin, destination, and date are required");
  }
  if (!requestedDate) throw new ApiError(400, "date must be a valid ISO date");

  const travelDate = startOfUtcDay(requestedDate);
  const today = startOfUtcDay(new Date());
  if (travelDate < today) throw new ApiError(400, "Travel date cannot be in the past");

  const cacheKey = searchCacheKey(origin, destination, req.query.date);
  const cachedResults = await getCached(cacheKey);
  if (cachedResults) {
    return res.json(new ApiResponse(200, "Buses found", cachedResults));
  }

  const nextDate = new Date(travelDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const routes = await Route.find({
    startLocation: { $regex: `^${escapeRegex(origin)}$`, $options: "i" },
    endLocation: { $regex: `^${escapeRegex(destination)}$`, $options: "i" },
  }).select("startLocation endLocation date totalDistance totalDuration buses").lean();

  if (!routes.length) {
    return res.json(new ApiResponse(200, "No routes found for the requested criteria", []));
  }

  const routeIds = routes.map((r) => r._id);
  const explicitBusIds = routes.flatMap((route) => route.buses || []);

  const buses = await Bus.find({
    $or: [
      { _id: { $in: explicitBusIds } },
      { startLocation: { $in: routeIds } },
      { endLocation: { $in: routeIds } },
    ],
  }).select("busNumber capacity amenities Seats startLocation endLocation").lean();

  if (!buses.length) {
    return res.json(new ApiResponse(200, "No buses found for this route", []));
  }

  const allBusIds = buses.map((b) => b._id);
  const Payment = (await import("../models/Payment.model.js")).default;
  const confirmedPayments = await Payment.find({
    bus: { $in: allBusIds },
    status: "confirmed",
  }).select("bus seats").lean();

  const bookedSeatsByBus = new Map();
  confirmedPayments.forEach((p) => {
    const bId = String(p.bus);
    if (!bookedSeatsByBus.has(bId)) bookedSeatsByBus.set(bId, new Set());
    (p.seats || []).forEach((s) => {
      if (s?.seatNumber) bookedSeatsByBus.get(bId).add(String(s.seatNumber).trim().toUpperCase());
    });
  });

  const results = [];
  for (const route of routes) {
    const routeMatchingBuses = buses.filter((bus) => {
      const isExplicit = (route.buses || []).some((bId) => String(bId) === String(bus._id));
      const isStartMatch = String(bus.startLocation) === String(route._id);
      const isEndMatch = String(bus.endLocation) === String(route._id);
      return isExplicit || isStartMatch || isEndMatch;
    });

    for (const bus of routeMatchingBuses) {
      const bookedSet = bookedSeatsByBus.get(String(bus._id)) || new Set();
      const totalSeats = (bus.Seats || []).length;
      let bookedCount = 0;
      (bus.Seats || []).forEach((seat) => {
        const num = String(seat.SeatNumber).trim().toUpperCase();
        if (seat.isAvailable === false || bookedSet.has(num)) {
          bookedCount += 1;
        }
      });
      const availableSeats = Math.max(0, totalSeats - bookedCount);

      results.push({
        id: bus._id,
        name: bus.busNumber,
        busNumber: bus.busNumber,
        amenities: bus.amenities || [],
        routeId: route._id,
        origin: route.startLocation,
        destination: route.endLocation,
        date: route.date,
        distance: route.totalDistance,
        duration: route.totalDuration,
        price: bus.Seats.length ? Math.min(...bus.Seats.map((seat) => Number(seat.price) || 0)) : 0,
        availableSeats,
        totalSeats,
      });
    }
  }

  await setCached(cacheKey, results, 300);
  res.json(new ApiResponse(200, "Buses found", results));
});
