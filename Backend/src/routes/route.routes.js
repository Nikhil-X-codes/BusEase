import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'

import {
  createRoute,
getroutes,
  updateRoute,
  deleteRoute,
  searchRoutes,
} from '../Controllers/routes.controller.js';

const RouteRouter = Router();

RouteRouter.post('/create', verifyJWT, createRoute);
RouteRouter.get('/search', verifyJWT,searchRoutes);
RouteRouter.get('/all', verifyJWT,getroutes);
RouteRouter.put('/update/:id', verifyJWT, updateRoute);
RouteRouter.delete('/delete/:id', verifyJWT, deleteRoute);


 
export default RouteRouter;