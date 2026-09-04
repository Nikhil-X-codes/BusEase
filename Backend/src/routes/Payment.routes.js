import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { userRateLimit } from '../middlewares/rateLimit.middleware.js';

import{
  createPayment,
  getPayments,
  getPaymentById,
  downloadTicketPdf,
} from '../Controllers/payment.controllers.js';

const PaymentRouter = Router();

PaymentRouter.post('/create', verifyJWT, userRateLimit({ name: 'user:booking', limit: 10, windowMs: 60 * 60 * 1000 }), createPayment);
PaymentRouter.get('/all', verifyJWT, getPayments);
PaymentRouter.get('/ticket/:id/pdf', verifyJWT, downloadTicketPdf);
PaymentRouter.get('/:id/ticket.pdf', verifyJWT, downloadTicketPdf);
PaymentRouter.get('/:id/pdf', verifyJWT, downloadTicketPdf);
PaymentRouter.get('/:id', verifyJWT, getPaymentById);


export default PaymentRouter;