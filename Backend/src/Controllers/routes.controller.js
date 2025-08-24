import asyncHandler from '../utils/Asynchandler.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';


const createRoute = asyncHandler(async (req, res) => {
  const { startLocation, endLocation, date, totalDistance, totalDuration } = req.body;

  if (!startLocation || !endLocation || !date || !totalDistance || !totalDuration) {
    throw new ApiError(400, "Start location, end location, date, totalDistance, and totalDuration are required");
  }

  const routeExists = await Route.findOne({
    startLocation: { $regex: `^${startLocation}$`, $options: "i" },
    endLocation: { $regex: `^${endLocation}$`, $options: "i" },
    date: new Date(date),
  });

  if (routeExists) {
    throw new ApiError(400, "Route with this start, end location, and date already exists");
  }

  const route = await Route.create({
    startLocation,
    endLocation,
    date: new Date(date),
    totalDistance: Number(totalDistance),
    totalDuration: Number(totalDuration),
    buses: [],
  });

  res.status(201).json(
    new ApiResponse(201, "Route created successfully", route)
  );
});


const getroutes = asyncHandler(async (req, res) => {
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
  const { startLocation, endLocation, date, totalDistance, totalDuration } = req.body;
  const routeId = req.params.id;

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
      const newDate = date ? new Date(date) : route.date;

      const duplicateRoute = await Route.findOne(
        {
          startLocation: { $regex: `^${newStart}$`, $options: "i" },
          endLocation: { $regex: `^${newEnd}$`, $options: "i" },
          date: newDate,
          _id: { $ne: route._id },
        },
        null,
        { session }
      );

      if (duplicateRoute) {
        throw new ApiError(400, "Route with this start, end location, and date already exists");
      }

      route.startLocation = newStart;
      route.endLocation = newEnd;
      route.date = newDate;
    }

    if (totalDistance !== undefined) route.totalDistance = Number(totalDistance);
    if (totalDuration !== undefined) route.totalDuration = Number(totalDuration);

    const updatedRoute = await route.save({ session });

    await session.commitTransaction();

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

    res.json(new ApiResponse(200, "Route removed successfully", { _id: routeId }));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(error.statusCode || 500, error.message || "Error deleting route");
  } finally {
    session.endSession();
  }
});


const searchRoutes = asyncHandler(async (req, res) => {
  const { startLocation, endLocation, date } = req.query;

  let query = {};
  if (startLocation) query.startLocation = { $regex: `^${startLocation}$`, $options: "i" };
  if (endLocation) query.endLocation = { $regex: `^${endLocation}$`, $options: "i" };
  if (date) query.date = new Date(date);

  if (Object.keys(query).length === 0) {
    throw new ApiError(400, "Please provide startLocation, endLocation, or date to search");
  }

  const routes = await Route.find(query)
    .populate({
      path: "buses",
      select: "busNumber capacity amenities Seats startLocation endLocation",
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