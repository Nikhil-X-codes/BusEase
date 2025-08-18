import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
  updateSeatAvailability,
   getBusesByLocation,
} from '../Controllers/Bus.controller.js';

const BookRouter = Router();

BookRouter.post('/create', verifyJWT, createBus);
BookRouter.get('/get', getBuses);
BookRouter.get('/:id', getBusById);
BookRouter.put('/update/:id', verifyJWT, updateBus);
BookRouter.delete('/delete/:id', verifyJWT, deleteBus);
BookRouter.put('/:id/seats/:seatNumber', verifyJWT, updateSeatAvailability);
BookRouter.get('/get/loc',  getBusesByLocation);


export default BookRouter;