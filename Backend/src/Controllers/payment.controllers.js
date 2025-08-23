import asyncHandler from '../utils/Asynchandler.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import Bus from '../models/Bus.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';


const createPayment = asyncHandler(async (req, res) => {
  const { busId, seatNumbers = [], cardDetails } = req.body;
  const userId = req.user?._id; 

  let userExists = null;
  if (userId) {
    userExists = await User.findById(userId);
    if (!userExists) throw new ApiError(404, 'User not found');
  }

  if (!busId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw new ApiError(400, 'busId and seatNumbers are required');
  }

  if (!cardDetails?.cardNumber?.match(/^\d{16}$/)) {
    throw new ApiError(400, 'Invalid card number. Must be 16 digits.');
  }
  if (!cardDetails?.expiryDate?.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
    throw new ApiError(400, 'Invalid expiry date. Use MM/YY format.');
  }
  if (!cardDetails?.cvv?.match(/^\d{3,4}$/)) {
    throw new ApiError(400, 'Invalid CVV. Must be 3 or 4 digits.');
  }
  if (!cardDetails?.cardHolderName?.trim()) {
    throw new ApiError(400, 'Cardholder name is required');
  }

  const bus = await Bus.findById(busId).populate({
    path: 'startLocation endLocation',
    select: 'startLocation endLocation',
  });
  if (!bus) throw new ApiError(404, 'Bus not found');

  const seatMap = new Map();
  bus.Seats.forEach((s) => seatMap.set(s.SeatNumber, s));

  const seatsToBook = [];
  let subtotal = 0;
  for (const num of seatNumbers) {
    const seat = seatMap.get(num);
    if (!seat) throw new ApiError(400, `Seat ${num} not found`);
    if (seat.isAvailable === false) throw new ApiError(400, `Seat ${num} already booked`);
    seatsToBook.push({ seatNumber: seat.SeatNumber, price: seat.price, type: seat.Type });
    subtotal += Number(seat.price) || 0;
  }

  const serviceFee = seatsToBook.length * 50;
  const convenienceFee = Math.round(subtotal * 0.02);
  const gstAmount = Math.round((subtotal + serviceFee + convenienceFee) * 0.12);
  const total = subtotal + serviceFee + convenienceFee + gstAmount;

  bus.Seats.forEach((s) => {
    if (seatNumbers.includes(s.SeatNumber)) {
      s.isAvailable = false;
    }
  });
  await bus.save();

  const payment = await Payment.create({
    user: userId || null, 
    bus: bus._id,
    seats: seatsToBook,
    startLocation: bus.startLocation?.startLocation,
    endLocation: bus.endLocation?.endLocation,
    amount: total,
    cardDetails: {
      cardNumber: cardDetails.cardNumber,
      cardHolderName: cardDetails.cardHolderName,
      expiryDate: cardDetails.expiryDate,
      cvv: cardDetails.cvv,
    },
  });

  const populatedPayment = await Payment.findById(payment._id).populate('bus', 'busNumber');

  res.status(201).json(new ApiResponse(201, 'Payment created successfully', populatedPayment));
});

const getPayments = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const payments = await Payment.find({ user: userId })
    .populate('bus', 'busNumber')
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, 'Payments retrieved successfully', payments));
});


const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, user: req.user?._id })
    .populate('bus', 'busNumber');

  if (payment) {
    res.json(new ApiResponse(200, 'Payment retrieved successfully', payment));
  } else {
    throw new ApiError(404, 'Payment not found');
  }
});



export {
  createPayment,
  getPayments,
  getPaymentById,
};