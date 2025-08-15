import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'

import{
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
} from '../Controllers/payment.controllers.js';

const PaymentRouter = Router();

PaymentRouter.post('/create', verifyJWT, createPayment);
PaymentRouter.get('/all', getPayments);
PaymentRouter.get('/:id', getPaymentById);
PaymentRouter.put('/update/:id', verifyJWT, updatePayment);

export default PaymentRouter;