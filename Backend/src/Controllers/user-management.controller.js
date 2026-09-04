import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import Payment from "../models/Payment.model.js";
import TripInventory from "../models/TripInventory.model.js";
import AuditLog from "../models/AuditLog.model.js";
import { cleanText, escapeRegex, isValidObjectId, parseDate } from "../utils/validation.js";
import { startOfUtcDay } from "../utils/tripInventory.js";

const safeUserProjection = "-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpires -passwordHistory";
const pageOptions = (query) => ({
  page: Math.max(1, Number.parseInt(query.page, 10) || 1),
  limit: Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20)),
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = pageOptions(req.query);
  const filter = { role: "user" };
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  if (req.query.from || req.query.to) {
    const from = req.query.from ? parseDate(req.query.from) : new Date(0);
    const to = req.query.to ? parseDate(req.query.to) : new Date();
    if (!from || !to) throw new ApiError(400, "Invalid user date range");
    to.setUTCDate(to.getUTCDate() + 1);
    filter.createdAt = { $gte: from, $lt: to };
  }
  if (req.query.search) {
    const search = escapeRegex(cleanText(req.query.search, 100));
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select(safeUserProjection).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const userIds = users.map((user) => user._id);
  const statistics = await Payment.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: "$user", bookings: { $sum: 1 }, spent: { $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$amount", 0] } } } },
  ]);
  const statsByUser = new Map(statistics.map((stat) => [String(stat._id), stat]));
  const data = users.map((user) => ({ ...user, totalBookings: statsByUser.get(String(user._id))?.bookings || 0, totalSpent: statsByUser.get(String(user._id))?.spent || 0 }));
  res.json(new ApiResponse(200, "Users retrieved successfully", { users: data, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const getUserDetails = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid user ID");
  const user = await User.findOne({ _id: req.params.id, role: "user" }).select(safeUserProjection).lean();
  if (!user) throw new ApiError(404, "User not found");
  const [bookings, statistics, activity] = await Promise.all([
    Payment.find({ user: user._id }).populate("bus", "busNumber").sort({ createdAt: -1 }).limit(20).lean(),
    Payment.aggregate([{ $match: { user: user._id } }, { $group: { _id: null, bookings: { $sum: 1 }, cancellations: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "refunded"]] }, 1, 0] } }, spent: { $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$amount", 0] } } } }]),
    AuditLog.find({ actor: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  res.json(new ApiResponse(200, "User details retrieved successfully", { user, bookings, statistics: statistics[0] || { bookings: 0, cancellations: 0, spent: 0 }, activity }));
});

export const deactivateUser = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid user ID");
  const session = await User.startSession();
  let cancelledBookings = [];
  try {
    await session.withTransaction(async () => {
      const user = await User.findOne({ _id: req.params.id, role: "user" }).session(session);
      if (!user) throw new ApiError(404, "User not found");
      if (!user.isActive) throw new ApiError(409, "User is already inactive");
      const today = startOfUtcDay(new Date());
      cancelledBookings = await Payment.find({ user: user._id, status: "confirmed", selectedDate: { $gte: today } }).session(session);
      for (const booking of cancelledBookings) {
        const inventory = await TripInventory.findOne({ bus: booking.bus, travelDate: startOfUtcDay(booking.selectedDate) }).session(session);
        if (!inventory) throw new ApiError(409, `Inventory missing for booking ${booking.transactionReference}`);
        await TripInventory.updateOne({ _id: inventory._id }, { $set: { "seats.$[seat].isAvailable": true }, $unset: { "seats.$[seat].bookedBy": 1, "seats.$[seat].reservationReference": 1 } }, { arrayFilters: [{ "seat.seatNumber": { $in: booking.seats.map((seat) => seat.seatNumber) } }], session });
        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        booking.cancellationReason = "Account deactivated by administrator";
        booking.refundAmount = booking.amount;
        booking.refundStatus = "simulated";
        await booking.save({ session });
      }
      user.isActive = false;
      user.refreshToken = undefined;
      await user.save({ session, validateBeforeSave: false });
    });
    res.json(new ApiResponse(200, "User deactivated and future bookings cancelled", { userId: req.params.id, cancelledBookings: cancelledBookings.length }));
  } finally {
    await session.endSession();
  }
});
