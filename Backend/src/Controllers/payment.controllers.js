import asyncHandler from '../utils/Asynchandler.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';


const createPayment = asyncHandler(async (req, res) => {
  const { user, cardDetails, amount } = req.body;

  const userExists = await User.findById(user);
  if (!userExists) {
    throw new ApiError(404, 'User not found');
  }

  if (!cardDetails.cardNumber.match(/^\d{16}$/)) {
    throw new ApiError(400, 'Invalid card number. Must be 16 digits.');
  }
  if (!cardDetails.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
    throw new ApiError(400, 'Invalid expiry date. Use MM/YY format.');
  }
  if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
    throw new ApiError(400, 'Invalid CVV. Must be 3 or 4 digits.');
  }

  const payment = await Payment.create({
    user,
    cardDetails: {
      cardNumber: cardDetails.cardNumber,
      cardHolderName: cardDetails.cardHolderName,
      expiryDate: cardDetails.expiryDate,
      cvv: cardDetails.cvv
    },
    amount
  });

  if (payment) {
    const populatedPayment = await Payment.findById(payment._id)
      .populate('user', 'name email');

    res.status(201).json(
      new ApiResponse(201, 'Payment created successfully', populatedPayment)
    );
  } else {
    throw new ApiError(400, 'Invalid payment data');
  }
});


const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({})
    .populate('user', 'name email');
  res.json(new ApiResponse(200, 'Payments retrieved successfully', payments));
});


const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'name email');

  if (payment) {
    res.json(new ApiResponse(200, 'Payment retrieved successfully', payment));
  } else {
    throw new ApiError(404, 'Payment not found');
  }
});


const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    if (req.body.user) {
      const userExists = await User.findById(req.body.user);
      if (!userExists) {
        throw new ApiError(404, 'User not found');
      }
    }

    if (req.body.cardDetails) {
      if (req.body.cardDetails.cardNumber && !req.body.cardDetails.cardNumber.match(/^\d{16}$/)) {
        throw new ApiError(400, 'Invalid card number. Must be 16 digits.');
      }
      if (req.body.cardDetails.expiryDate && !req.body.cardDetails.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        throw new ApiError(400, 'Invalid expiry date. Use MM/YY format.');
      }
      if (req.body.cardDetails.cvv && !req.body.cardDetails.cvv.match(/^\d{3,4}$/)) {
        throw new ApiError(400, 'Invalid CVV. Must be 3 or 4 digits.');
      }
    }

    payment.user = req.body.user || payment.user;
    payment.cardDetails = {
      cardNumber: req.body.cardDetails?.cardNumber || payment.cardDetails.cardNumber,
      cardHolderName: req.body.cardDetails?.cardHolderName || payment.cardDetails.cardHolderName,
      expiryDate: req.body.cardDetails?.expiryDate || payment.cardDetails.expiryDate,
      cvv: req.body.cardDetails?.cvv || payment.cardDetails.cvv
    };
    payment.amount = req.body.amount || payment.amount;

    const updatedPayment = await payment.save();

    const populatedPayment = await Payment.findById(updatedPayment._id)
      .populate('user', 'name email');

    res.json(
      new ApiResponse(200, 'Payment updated successfully', populatedPayment)
    );
  } else {
    throw new ApiError(404, 'Payment not found');
  }
});



export {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
};