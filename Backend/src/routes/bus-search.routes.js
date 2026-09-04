import Router from "express";
import { searchBuses } from "../Controllers/search.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/rateLimit.middleware.js";

const busSearchRouter = Router();
busSearchRouter.get("/search", rateLimit({ name: "search:ip", limit: 500, windowMs: 15 * 60 * 1000 }), verifyJWT, searchBuses);

export default busSearchRouter;
