import Router from "express";
import { createAdmin, deactivateAdmin, listAdmins } from "../Controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin, verifySuperAdmin, auditAdminAction } from "../middlewares/admin.middleware.js";
import { adminIpGuard } from "../middlewares/rateLimit.middleware.js";
import { rateLimit } from "../middlewares/rateLimit.middleware.js";
import { createBus, updateBus } from "../Controllers/Bus.controller.js";
import { createRoute, updateRoute } from "../Controllers/routes.controller.js";
import { deleteAdminRoute, getDashboardSummary, getRecentBookings, listAdminBuses, listAdminRoutes, updateBusStatus, updateRouteStatus } from "../Controllers/dashboard.controller.js";
import { cancelBooking, downloadBookingTicketPdf, getBooking, listBookings, refundBooking } from "../Controllers/booking.controller.js";
import { deactivateUser, getUserDetails, listUsers } from "../Controllers/user-management.controller.js";

const adminRouter = Router();
const superAdminOnly = [adminIpGuard, verifyJWT, verifySuperAdmin];
const adminLimit = rateLimit({ name: "admin:ip", limit: 200, windowMs: 15 * 60 * 1000 });

adminRouter.get("/users", adminLimit, ...superAdminOnly, auditAdminAction("list", "admin"), listAdmins);
adminRouter.post("/users", adminLimit, ...superAdminOnly, auditAdminAction("create", "admin"), createAdmin);
adminRouter.patch("/users/:id/deactivate", adminLimit, ...superAdminOnly, auditAdminAction("deactivate", "admin"), deactivateAdmin);

const adminOnly = [adminIpGuard, verifyJWT, verifyAdmin];
adminRouter.get("/dashboard/summary", adminLimit, ...adminOnly, getDashboardSummary);
adminRouter.get("/bookings/recent", adminLimit, ...adminOnly, getRecentBookings);
adminRouter.get("/buses", adminLimit, ...adminOnly, listAdminBuses);
adminRouter.post("/buses", adminLimit, ...adminOnly, auditAdminAction("create", "bus"), createBus);
adminRouter.put("/buses/:id", adminLimit, ...adminOnly, auditAdminAction("update", "bus"), updateBus);
adminRouter.patch("/buses/:id/status", adminLimit, ...adminOnly, auditAdminAction("status", "bus"), updateBusStatus);
adminRouter.get("/routes", adminLimit, ...adminOnly, listAdminRoutes);
adminRouter.post("/routes", adminLimit, ...adminOnly, auditAdminAction("create", "route"), createRoute);
adminRouter.put("/routes/:id", adminLimit, ...adminOnly, auditAdminAction("update", "route"), updateRoute);
adminRouter.patch("/routes/:id/status", adminLimit, ...adminOnly, auditAdminAction("status", "route"), updateRouteStatus);
adminRouter.delete("/routes/:id", adminLimit, ...adminOnly, auditAdminAction("delete", "route"), deleteAdminRoute);
adminRouter.get("/customers", adminLimit, ...adminOnly, listUsers);
adminRouter.get("/customers/:id", adminLimit, ...adminOnly, getUserDetails);
adminRouter.patch("/customers/:id/deactivate", adminLimit, ...adminOnly, auditAdminAction("deactivate", "user"), deactivateUser);
adminRouter.get("/bookings", adminLimit, ...adminOnly, listBookings);
adminRouter.get("/bookings/:id/pdf", adminLimit, ...adminOnly, downloadBookingTicketPdf);
adminRouter.get("/bookings/:id", adminLimit, ...adminOnly, getBooking);
adminRouter.patch("/bookings/:id/cancel", adminLimit, ...adminOnly, auditAdminAction("cancel", "booking"), cancelBooking);
adminRouter.patch("/bookings/:id/refund", adminLimit, ...adminOnly, auditAdminAction("refund", "booking"), refundBooking);

export default adminRouter;
