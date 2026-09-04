import asyncHandler from '../utils/Asynchandler.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import Bus from '../models/Bus.model.js';
import { cleanText, escapeRegex, isValidObjectId, parseDate } from '../utils/validation.js';
import { startOfUtcDay } from '../utils/tripInventory.js';
import { invalidateSearchCache } from '../utils/cache.js';


const createRoute = asyncHandler(async (req, res) => {
  const start = cleanText(req.body.startLocation, 100);
  const end = cleanText(req.body.endLocation, 100);
  const parsedDate = req.body.date ? parseDate(req.body.date) : null;
  const date = parsedDate ? startOfUtcDay(parsedDate) : null;
  const totalDistance = req.body.totalDistance !== undefined && req.body.totalDistance !== "" ? Number(req.body.totalDistance) : null;
  const totalDuration = req.body.totalDuration !== undefined && req.body.totalDuration !== "" ? Number(req.body.totalDuration) : null;

  if (!start || !end || !date) {
    throw new ApiError(400, "Start location, end location, and date are required");
  }

  if (!Number.isFinite(totalDistance) || totalDistance <= 0 || !Number.isFinite(totalDuration) || totalDuration <= 0) {
    throw new ApiError(400, "Valid positive totalDistance and totalDuration are required");
  }

  const routeExists = await Route.findOne({
    startLocation: { $regex: `^${escapeRegex(start)}$`, $options: "i" },
    endLocation: { $regex: `^${escapeRegex(end)}$`, $options: "i" },
    date,
  });

  if (routeExists) {
    throw new ApiError(409, "Route with this start, end location, and date already exists");
  }

  const route = await Route.create({
    startLocation: start,
    endLocation: end,
    date,
    totalDistance,
    totalDuration,
    buses: [],
  });
  await invalidateSearchCache();

  res.status(201).json(
    new ApiResponse(201, "Route created successfully", route)
  );
});


const getroutes = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  const routes = await Route.find({})
    .populate({
      path: "buses",
      select: "busNumber capacity amenities startLocation endLocation",
    })
    .select("startLocation endLocation date totalDistance totalDuration buses")
    .lean();

  res.json(new ApiResponse(200, "Routes retrieved successfully", routes));
});

const updateRoute = asyncHandler(async (req, res) => {
  const startLocation = req.body.startLocation === undefined ? undefined : cleanText(req.body.startLocation, 100);
  const endLocation = req.body.endLocation === undefined ? undefined : cleanText(req.body.endLocation, 100);
  const date = req.body.date === undefined ? undefined : parseDate(req.body.date);
  const totalDistance = req.body.totalDistance === undefined ? undefined : Number(req.body.totalDistance);
  const totalDuration = req.body.totalDuration === undefined ? undefined : Number(req.body.totalDuration);
  const routeId = req.params.id;

  if (!isValidObjectId(routeId)) throw new ApiError(400, "Invalid route ID");
  if (req.body.date !== undefined && !date) throw new ApiError(400, "Invalid route date");
  if (totalDistance !== undefined && (!Number.isFinite(totalDistance) || totalDistance <= 0)) throw new ApiError(400, "Distance must be a positive number");
  if (totalDuration !== undefined && (!Number.isFinite(totalDuration) || totalDuration <= 0)) throw new ApiError(400, "Duration must be a positive number");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const route = await Route.findById(routeId).session(session);
    if (!route) {
      throw new ApiError(404, "Route not found");
    }

    if (startLocation || endLocation || date) {
      const newStart = startLocation || route.startLocation;
      const newEnd = endLocation || route.endLocation;
      const newDate = date ? startOfUtcDay(date) : route.date;

      const duplicateRoute = await Route.findOne(
        {
          startLocation: { $regex: `^${escapeRegex(newStart)}$`, $options: "i" },
          endLocation: { $regex: `^${escapeRegex(newEnd)}$`, $options: "i" },
          date: newDate,
          _id: { $ne: route._id },
        },
        null,
        { session }
      );

      if (duplicateRoute) {
        throw new ApiError(409, "Route with this start, end location, and date already exists");
      }

      route.startLocation = newStart;
      route.endLocation = newEnd;
      route.date = newDate;
    }

    if (totalDistance !== undefined) route.totalDistance = Number(totalDistance);
    if (totalDuration !== undefined) route.totalDuration = Number(totalDuration);

    const updatedRoute = await route.save({ session });

    await session.commitTransaction();
    await invalidateSearchCache();

    res.json(
      new ApiResponse(200, "Route updated successfully", {
        _id: updatedRoute._id,
        startLocation: updatedRoute.startLocation,
        endLocation: updatedRoute.endLocation,
        date: updatedRoute.date,
        totalDistance: updatedRoute.totalDistance,
        totalDuration: updatedRoute.totalDuration,
        buses: updatedRoute.buses,
      })
    );
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(error.statusCode || 500, error.message || "Error updating route");
  } finally {
    session.endSession();
  }
});

const deleteRoute = asyncHandler(async (req, res) => {
  const routeId = req.params.id;
  if (!isValidObjectId(routeId)) throw new ApiError(400, "Invalid route ID");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const route = await Route.findById(routeId).session(session);
    if (!route) {
      throw new ApiError(404, "Route not found");
    }

    // Check if any buses reference this route
    const buses = await Bus.find({
      $or: [{ startLocation: routeId }, { endLocation: routeId }],
    }).session(session);

    if (buses.length > 0) {
      throw new ApiError(400, "Cannot delete route as it is referenced by one or more buses");
    }

    await Route.findByIdAndDelete(routeId).session(session);
    await session.commitTransaction();
    await invalidateSearchCache();

    res.json(new ApiResponse(200, "Route removed successfully", { _id: routeId }));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(error.statusCode || 500, error.message || "Error deleting route");
  } finally {
    session.endSession();
  }
});


const searchRoutes = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  const { startLocation, endLocation, date } = req.query;

  let query = {};
  if (startLocation) query.startLocation = { $regex: `^${escapeRegex(cleanText(startLocation, 100))}$`, $options: "i" };
  if (endLocation) query.endLocation = { $regex: `^${escapeRegex(cleanText(endLocation, 100))}$`, $options: "i" };
  if (date) {
    const parsedDate = parseDate(date);
    if (!parsedDate) throw new ApiError(400, "Invalid route date");
    const dayStart = startOfUtcDay(parsedDate);
    const nextDate = new Date(dayStart);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    query.date = { $gte: dayStart, $lt: nextDate };
  }

  if (Object.keys(query).length === 0) {
    throw new ApiError(400, "Please provide startLocation, endLocation, or date to search");
  }

  const routes = await Route.find(query)
    .populate({
      path: "buses",
      select: "busNumber capacity amenities Seats.price startLocation endLocation",
    })
    .select("startLocation endLocation date totalDistance totalDuration buses")
    .lean();

  res.json(new ApiResponse(200, "Routes found", routes));
});

export {
  createRoute,
  getroutes,
  updateRoute,
  deleteRoute,
  searchRoutes,
};