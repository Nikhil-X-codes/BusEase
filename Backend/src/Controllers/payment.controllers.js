import asyncHandler from '../utils/Asynchandler.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import Bus from '../models/Bus.model.js';
import TripInventory from '../models/TripInventory.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import crypto from 'crypto';
import { isValidObjectId, parseDate } from '../utils/validation.js';
import { ensureInventory, startOfUtcDay } from '../utils/tripInventory.js';
import { invalidateSearchCache } from '../utils/cache.js';
import { sendBookingConfirmationEmail, sendPaymentReceiptEmail } from '../utils/Nodemailer.js';
import { generateBookingId } from '../utils/bookingId.js';
import { streamTicketPdf } from '../utils/pdfGenerator.js';
import { clearSeatHolds, getHeldSeatsMap } from '../utils/seatHold.js';


const createPayment = asyncHandler(async (req, res) => {
  const { busId, seatNumbers = [], selectedDate, email: providedEmail } = req.body;
  const userId = req.user?._id; 
  const recipientEmail = (providedEmail && typeof providedEmail === 'string' && providedEmail.trim())
    ? providedEmail.trim().toLowerCase()
    : req.user?.email;

  if (!busId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw new ApiError(400, 'busId and seatNumbers are required');
  }
  if (!isValidObjectId(busId)) throw new ApiError(400, 'Invalid bus ID');
  if (!seatNumbers.every((seatNumber) => typeof seatNumber === 'string' && seatNumber.trim().length > 0)) {
    throw new ApiError(400, 'Seat numbers must be non-empty strings');
  }
  const travelDate = selectedDate ? parseDate(selectedDate) : undefined;
  if (!travelDate) throw new ApiError(400, 'A valid travel date is required');
  if (startOfUtcDay(travelDate) < startOfUtcDay(new Date())) {
    throw new ApiError(400, 'Travel date cannot be in the past');
  }

  if (!userId) throw new ApiError(401, 'Login is required to book a seat');

  const bookedSeatNumbers = [...new Set(seatNumbers.map((s) => String(s).trim().toUpperCase()))];
  if (bookedSeatNumbers.length !== seatNumbers.length) {
    throw new ApiError(400, 'Duplicate seats are not allowed');
  }

  // Verify seat holds
  const heldMap = await getHeldSeatsMap(busId, travelDate, bookedSeatNumbers);
  for (const seatNum of bookedSeatNumbers) {
    const holdInfo = heldMap.get(seatNum);
    if (holdInfo && String(holdInfo.userId) !== String(userId)) {
      throw new ApiError(409, `Seat ${seatNum} is currently held by another passenger. Please select another seat.`);
    }
  }

  const session = await Bus.startSession();
  let payment;
  const reservationReference = `RES-${crypto.randomUUID()}`;
  try {
    await session.withTransaction(async () => {
      const userExists = await User.findById(userId).session(session);
      if (!userExists) throw new ApiError(404, 'User not found');

      const bus = await Bus.findById(busId).populate({
        path: 'startLocation endLocation',
        select: 'startLocation endLocation',
      }).session(session);
      if (!bus) throw new ApiError(404, 'Bus not found');

      const inventory = await ensureInventory(bus, travelDate, session);
      const inventorySeatMap = new Map(inventory.seats.map((seat) => [String(seat.seatNumber).trim().toUpperCase(), seat]));
      const seatMap = new Map(bus.Seats.map((seat) => [String(seat.SeatNumber).trim().toUpperCase(), seat]));
      const seatsToBook = [];
      let subtotal = 0;
      for (const num of bookedSeatNumbers) {
        const seat = seatMap.get(num);
        const inventorySeat = inventorySeatMap.get(num);
        if (!seat || !inventorySeat) throw new ApiError(400, `Seat ${num} is not configured for this trip`);
        if (seat.isAvailable === false || inventorySeat.isAvailable === false) {
          throw new ApiError(409, `Seat ${num} is already booked on this bus`);
        }
        seatsToBook.push({ seatNumber: seat.SeatNumber, price: seat.price, type: seat.Type });
        subtotal += Number(seat.price) || 0;
      }

      const serviceFee = seatsToBook.length * 50;
      const convenienceFee = Math.round(subtotal * 0.02);
      const gstAmount = Math.round((subtotal + serviceFee + convenienceFee) * 0.12);
      const total = subtotal + serviceFee + convenienceFee + gstAmount;
      const bookingId = await generateBookingId(travelDate, session);

      // Permanently mark seats as booked on the Bus model
      await Bus.updateOne(
        { _id: bus._id },
        { $set: { 'Seats.$[elem].isAvailable': false } },
        { arrayFilters: [{ 'elem.SeatNumber': { $in: bookedSeatNumbers } }], session }
      );

      // Also mark seats as booked across all trip inventories for this bus
      await TripInventory.updateMany(
        { bus: bus._id },
        { $set: { 'seats.$[seat].isAvailable': false, 'seats.$[seat].bookedBy': userId, 'seats.$[seat].reservationReference': reservationReference } },
        { arrayFilters: [{ 'seat.seatNumber': { $in: bookedSeatNumbers } }], session }
      );

      [payment] = await Payment.create([{
        user: userId,
        bus: bus._id,
        seats: seatsToBook,
        startLocation: bus.startLocation?.startLocation,
        selectedDate: startOfUtcDay(travelDate),
        endLocation: bus.endLocation?.endLocation,
        amount: total,
        transactionReference: `DEMO-${crypto.randomUUID()}`,
        bookingId,
        status: 'confirmed',
      }], { session });
    });
  } catch (error) {
    console.error(`[BOOKING][ROLLBACK] reference=${reservationReference}`, error);
    throw error;
  } finally {
    await session.endSession();
  }

  // Release temporary seat hold on successful booking
  await clearSeatHolds(busId, travelDate, bookedSeatNumbers);
  await invalidateSearchCache();

  const populatedPayment = await Payment.findById(payment._id)
    .populate('user', 'username email')
    .populate({
      path: 'bus',
      select: 'busNumber date startLocation endLocation capacity',
      populate: {
        path: 'startLocation endLocation',
        select: 'startLocation endLocation',
      },
    })
    .lean();

  if (recipientEmail) {
    await Promise.all([
      sendBookingConfirmationEmail(recipientEmail, populatedPayment || payment).catch((error) => console.error('[EMAIL] booking confirmation failed:', error.message)),
      sendPaymentReceiptEmail(recipientEmail, populatedPayment || payment).catch((error) => console.error('[EMAIL] payment receipt failed:', error.message)),
    ]);
  }

  res.status(201).json(new ApiResponse(201, 'Payment created successfully', populatedPayment || payment));
});

const getPayments = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  const userId = req.user?._id;
  const payments = await Payment.find({ user: userId })
    .populate('bus', 'busNumber date')
    .sort({ createdAt: -1 })
    .lean();
  res.json(new ApiResponse(200, 'Payments retrieved successfully', payments));
});


const getPaymentById = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid payment ID');
  const payment = await Payment.findOne({ _id: req.params.id, user: req.user?._id })
    .populate('bus', 'busNumber date')
    .lean();

  if (payment) {
    res.json(new ApiResponse(200, 'Payment retrieved successfully', payment));
  } else {
    throw new ApiError(404, 'Payment not found');
  }
});

const downloadTicketPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = isValidObjectId(id);

  const query = isMongoId ? { _id: id } : { bookingId: id };

  // If user is not admin, scope to user's bookings
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    query.user = req.user?._id;
  }

  const payment = await Payment.findOne(query)
    .populate('user', 'username email')
    .populate({
      path: 'bus',
      select: 'busNumber date startLocation endLocation capacity',
      populate: {
        path: 'startLocation endLocation',
        select: 'startLocation endLocation',
      },
    })
    .lean();

  if (!payment) {
    throw new ApiError(404, 'Booking or ticket not found');
  }

  const filename = `BusEase-Ticket-${payment.bookingId || payment._id}.pdf`;
  const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, no-transform, max-age=3600');

  streamTicketPdf(payment, res);
});

export {
  createPayment,
  getPayments,
  getPaymentById,
  downloadTicketPdf,
};