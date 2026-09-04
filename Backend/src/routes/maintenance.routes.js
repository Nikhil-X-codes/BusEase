import Router from "express";
import { maintainInventory } from "../Controllers/maintenance.controller.js";

const maintenanceRouter = Router();
maintenanceRouter.post("/inventory", maintainInventory);

export default maintenanceRouter;
