import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bus from "../models/Bus.model.js";
import Route from "../models/Routes.model.js";
import Payment from "../models/Payment.model.js";
import TripInventory from "../models/TripInventory.model.js";
import User from "../models/User.model.js";
import { startOfUtcDay } from "../utils/tripInventory.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const today = startOfUtcDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const monthStart = new Date(today);
  monthStart.setUTCDate(monthStart.getUTCDate() - 29);

  const [activeBuses, bookingsToday, bookingsWeek, bookingsMonth, revenueToday, revenueWeek, revenueMonth, activeUsers, inventory] = await Promise.all([
    Bus.countDocuments({ isActive: true }),
    Payment.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: { $ne: "cancelled" } }),
    Payment.countDocuments({ createdAt: { $gte: weekStart, $lt: tomorrow }, status: { $ne: "cancelled" } }),
    Payment.countDocuments({ createdAt: { $gte: monthStart, $lt: tomorrow }, status: { $ne: "cancelled" } }),
    Payment.aggregate([{ $match: { createdAt: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { createdAt: { $gte: weekStart, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { createdAt: { $gte: monthStart, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    User.countDocuments({ lastActivityAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } }),
    TripInventory.aggregate([{ $match: { travelDate: today } }, { $unwind: "$seats" }, { $group: { _id: null, totalSeats: { $sum: 1 }, occupiedSeats: { $sum: { $cond: ["$seats.isAvailable", 0, 1] } } } }]),
  ]);
  const occupancy = inventory[0] || { totalSeats: 0, occupiedSeats: 0 };
  res.json(new ApiResponse(200, "Dashboard summary retrieved successfully", {
    activeBuses,
    bookings: { today: bookingsToday, week: bookingsWeek, month: bookingsMonth },
    revenue: { today: revenueToday[0]?.total || 0, week: revenueWeek[0]?.total || 0, month: revenueMonth[0]?.total || 0 },
    activeUsers,
    seats: { available: occupancy.totalSeats - occupancy.occupiedSeats, occupied: occupancy.occupiedSeats, total: occupancy.totalSeats },
  }));
});

export const getRecentBookings = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const bookings = await Payment.find({}).populate("user", "username email").populate("bus", "busNumber").sort({ createdAt: -1 }).limit(limit).lean();
  res.json(new ApiResponse(200, "Recent bookings retrieved successfully", bookings));
});

export const listAdminBuses = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = {};
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  if (req.query.search) filter.busNumber = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const [buses, total] = await Promise.all([
    Bus.find(filter).select("busNumber capacity amenities isActive startLocation endLocation").populate("startLocation endLocation", "startLocation endLocation").sort({ busNumber: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Bus.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, "Buses retrieved successfully", { buses, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const listAdminRoutes = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = {};
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  const [routes, total] = await Promise.all([
    Route.find(filter).select("startLocation endLocation date totalDistance totalDuration buses isActive").sort({ date: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Route.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, "Routes retrieved successfully", { routes, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const updateBusStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== "boolean") throw new ApiError(400, "isActive must be boolean");
  const bus = await Bus.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true, runValidators: true }).select("busNumber isActive").lean();
  if (!bus) throw new ApiError(404, "Bus not found");
  res.json(new ApiResponse(200, "Bus status updated successfully", bus));
});

export const updateRouteStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== "boolean") throw new ApiError(400, "isActive must be boolean");
  const route = await Route.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true, runValidators: true }).select("startLocation endLocation isActive").lean();
  if (!route) throw new ApiError(404, "Route not found");
  res.json(new ApiResponse(200, "Route status updated successfully", route));
});

export const deleteAdminRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id).select("buses");
  if (!route) throw new ApiError(404, "Route not found");
  if (route.buses.length) {
    route.buses = [];
    await route.save();
  }
  await route.deleteOne();
  res.json(new ApiResponse(200, "Route deleted successfully", { _id: req.params.id }));
});
