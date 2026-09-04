import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Payment from "../models/Payment.model.js";
import TripInventory from "../models/TripInventory.model.js";
import User from "../models/User.model.js";
import { isValidObjectId, parseDate, cleanText, escapeRegex } from "../utils/validation.js";
import { startOfUtcDay } from "../utils/tripInventory.js";
import { sendBookingCancellationEmail } from "../utils/Nodemailer.js";
import { streamTicketPdf } from "../utils/pdfGenerator.js";

const parsePage = (query) => ({
  page: Math.max(1, Number.parseInt(query.page, 10) || 1),
  limit: Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20)),
});

export const listBookings = asyncHandler(async (req, res) => {
  const { page, limit } = parsePage(req.query);
  const filter = {};
  if (req.query.status && ["confirmed", "cancelled", "refunded"].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.userId) {
    if (!isValidObjectId(req.query.userId)) throw new ApiError(400, "Invalid user ID");
    filter.user = req.query.userId;
  }
  if (req.query.busId) {
    if (!isValidObjectId(req.query.busId)) throw new ApiError(400, "Invalid bus ID");
    filter.bus = req.query.busId;
  }
  if (req.query.from || req.query.to) {
    const from = req.query.from ? parseDate(req.query.from) : new Date(0);
    const to = req.query.to ? parseDate(req.query.to) : new Date();
    if (!from || !to) throw new ApiError(400, "Invalid booking date range");
    to.setUTCDate(to.getUTCDate() + 1);
    filter.selectedDate = { $gte: startOfUtcDay(from), $lt: to };
  }
  if (req.query.search) {
    const search = escapeRegex(cleanText(req.query.search, 100));
    const users = await (await import("../models/User.model.js")).default.find({
      $or: [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
    }).select("_id").lean();
    filter.$or = [{ bookingId: { $regex: search, $options: "i" } }, { transactionReference: { $regex: search, $options: "i" } }, { user: { $in: users.map((user) => user._id) } }];
  }
  const sortField = ["createdAt", "amount", "status", "selectedDate"].includes(req.query.sort) ? req.query.sort : "createdAt";
  const sortDirection = req.query.order === "asc" ? 1 : -1;
  const [bookings, total] = await Promise.all([
    Payment.find(filter).populate("user", "username email").populate("bus", "busNumber").sort({ [sortField]: sortDirection }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, "Bookings retrieved successfully", { bookings, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const getBooking = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID");
  const booking = await Payment.findById(req.params.id).populate("user", "username email").populate("bus", "busNumber capacity").lean();
  if (!booking) throw new ApiError(404, "Booking not found");
  res.json(new ApiResponse(200, "Booking retrieved successfully", booking));
});

export const cancelBooking = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID");
  const reason = cleanText(req.body.reason, 500);
  if (!reason) throw new ApiError(400, "Cancellation reason is required");

  const session = await Payment.startSession();
  try {
    let booking;
    await session.withTransaction(async () => {
      booking = await Payment.findById(req.params.id).session(session);
      if (!booking) throw new ApiError(404, "Booking not found");
      if (booking.status !== "confirmed") throw new ApiError(409, "Only confirmed bookings can be cancelled");
      const seatNumbers = booking.seats.map((seat) => String(seat.seatNumber).trim().toUpperCase());
      
      // Re-enable seats on the Bus model
      const BusModel = (await import("../models/Bus.model.js")).default;
      await BusModel.updateOne(
        { _id: booking.bus },
        { $set: { "Seats.$[elem].isAvailable": true } },
        { arrayFilters: [{ "elem.SeatNumber": { $in: seatNumbers } }], session }
      );

      // Re-enable seats across trip inventories
      await TripInventory.updateMany(
        { bus: booking.bus },
        { $set: { "seats.$[seat].isAvailable": true }, $unset: { "seats.$[seat].bookedBy": 1, "seats.$[seat].reservationReference": 1 } },
        { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }], session }
      );
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason;
      booking.refundAmount = booking.amount;
      booking.refundStatus = "simulated";
      await booking.save({ session });
    });
    const user = await User.findById(booking.user).select("email").lean();
    await sendBookingCancellationEmail(user?.email, booking.bookingId || booking.transactionReference, reason, booking.refundAmount)
      .catch((error) => console.error("[BOOKING] cancellation email failed:", error.message));
    res.json(new ApiResponse(200, "Booking cancelled and simulated refund recorded", booking));
  } finally {
    await session.endSession();
  }
});

export const refundBooking = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID");
  const booking = await Payment.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "cancelled") throw new ApiError(409, "Only cancelled bookings can be refunded");
  const amount = req.body.amount === undefined ? booking.amount : Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > booking.amount) throw new ApiError(400, "Refund amount is invalid");
  booking.refundAmount = amount;
  booking.refundStatus = "simulated";
  booking.status = "refunded";
  await booking.save();
  res.json(new ApiResponse(200, "Simulated refund processed", booking));
});

export const downloadBookingTicketPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = isValidObjectId(id);
  const query = isMongoId ? { _id: id } : { bookingId: id };

  const booking = await Payment.findOne(query)
    .populate("user", "username email")
    .populate({
      path: "bus",
      select: "busNumber capacity date startLocation endLocation",
      populate: {
        path: "startLocation endLocation",
        select: "startLocation endLocation",
      },
    })
    .lean();

  if (!booking) throw new ApiError(404, "Booking not found");

  const filename = `BusEase-Ticket-${booking.bookingId || booking._id}.pdf`;
  const disposition = req.query.inline === "true" ? "inline" : "attachment";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-transform, max-age=3600");

  streamTicketPdf(booking, res);
});