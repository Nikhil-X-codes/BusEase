import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'

import{
  createPayment,
  getPayments,
  getPaymentById,
} from '../Controllers/payment.controllers.js';

const PaymentRouter = Router();

PaymentRouter.post('/create', verifyJWT, createPayment);
PaymentRouter.get('/all', verifyJWT, getPayments);
PaymentRouter.get('/:id', verifyJWT, getPaymentById);


export default PaymentRouter;