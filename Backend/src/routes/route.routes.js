import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'

import {
  createRoute,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchRoutes
} from '../Controllers/routes.controller.js';

const RouteRouter = Router();

RouteRouter.post('/create', verifyJWT, createRoute);
RouteRouter.get('/search', searchRoutes);
RouteRouter.get('/:id', getRouteById);
RouteRouter.put('/update/:id', verifyJWT, updateRoute);
RouteRouter.delete('/delete/:id', verifyJWT, deleteRoute);


export default RouteRouter;