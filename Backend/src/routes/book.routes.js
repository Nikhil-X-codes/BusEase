import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { requireAdmin } from '../middlewares/role.middleware.js';
import { getTripInventory, holdSeatsController, releaseSeatsController } from '../Controllers/inventory.controller.js';
import { adminIpGuard, rateLimit } from '../middlewares/rateLimit.middleware.js';
import { auditAdminAction } from '../middlewares/admin.middleware.js';
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
const generalLimit = rateLimit({ name: 'general:ip', limit: 600, windowMs: 15 * 60 * 1000 });
const inventoryLimit = rateLimit({ name: 'inventory:ip', limit: 1200, windowMs: 15 * 60 * 1000 });
const adminLimit = rateLimit({ name: 'admin:ip', limit: 500, windowMs: 15 * 60 * 1000 });

BookRouter.post('/create', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('create', 'bus'), createBus);
BookRouter.get('/get', generalLimit, getBuses);
BookRouter.get('/get/loc', generalLimit, getBusesByLocation);
BookRouter.get('/:busId/inventory', inventoryLimit, verifyJWT, getTripInventory);
BookRouter.post('/:busId/inventory/hold', generalLimit, verifyJWT, holdSeatsController);
BookRouter.post('/:busId/inventory/release', generalLimit, verifyJWT, releaseSeatsController);
BookRouter.get('/:id', generalLimit, getBusById);
BookRouter.put('/update/:id', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('update', 'bus'), updateBus);
BookRouter.delete('/delete/:id', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('delete', 'bus'), deleteBus);
BookRouter.put('/:id/seats/:seatNumber', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('update-seat', 'bus'), updateSeatAvailability);


export default BookRouter;