import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { requireAdmin } from '../middlewares/role.middleware.js';
import { adminIpGuard, rateLimit } from '../middlewares/rateLimit.middleware.js';
import { auditAdminAction } from '../middlewares/admin.middleware.js';

import {
  createRoute,
  getroutes,
  updateRoute,
  deleteRoute,
  searchRoutes,
} from '../Controllers/routes.controller.js';

const RouteRouter = Router();
const generalLimit = rateLimit({ name: 'general:ip', limit: 500, windowMs: 15 * 60 * 1000 });
const adminLimit = rateLimit({ name: 'admin:ip', limit: 500, windowMs: 15 * 60 * 1000 });

RouteRouter.post('/create', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('create', 'route'), createRoute);
RouteRouter.get('/search', generalLimit, searchRoutes);
RouteRouter.get('/all', generalLimit, getroutes);
RouteRouter.put('/update/:id', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('update', 'route'), updateRoute);
RouteRouter.delete('/delete/:id', adminLimit, adminIpGuard, verifyJWT, requireAdmin, auditAdminAction('delete', 'route'), deleteRoute);


 
export default RouteRouter;