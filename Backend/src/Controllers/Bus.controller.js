import asyncHandler from '../utils/Asynchandler.js'
import Bus from '../models/Bus.model.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import { cleanText, escapeRegex, isValidObjectId } from '../utils/validation.js';
import { ensureRollingInventoryForBus } from '../utils/tripInventory.js';
import { invalidateSearchCache } from '../utils/cache.js';


const createBus = asyncHandler(async (req, res) => {
  const busNumber = cleanText(req.body.busNumber, 40);
  const startLocationName = cleanText(req.body.startLocationName, 100);
  const endLocationName = cleanText(req.body.endLocationName, 100);
  const { amenities, Seats } = req.body;

  if (!busNumber || !Seats || !Array.isArray(Seats) || !startLocationName || !endLocationName) {
    throw new ApiError(400, "Bus number, seats (array), startLocationName, and endLocationName are required");
  }
  Seats.forEach((seat) => {
    if (!["Sleeper", "Seater"].includes(seat.Type)) {
      throw new ApiError(400, `Invalid seat type: ${seat.SeatNumber}. Must be "Sleeper" or "Seater"`);
    }
    if (seat.Type === "Seater" && !["Window", "Non-Window"].includes(seat.Seating)) {
      throw new ApiError(400, `Seat ${seat.SeatNumber} (Seater) must have Seating as "Window" or "Non-Window"`);
    }
    if (typeof seat.price !== "number" || seat.price <= 0) {
      throw new ApiError(400, `Seat ${seat.SeatNumber} must have a positive price`);
    }
  });

  const seatNumbers = Seats.map((s) => s.SeatNumber);
  const hasDuplicate = new Set(seatNumbers).size !== seatNumbers.length;
  if (hasDuplicate) {
    throw new ApiError(400, "Duplicate seat numbers within the same bus");
  }

  const busExists = await Bus.findOne({ busNumber });
  if (busExists) {
    throw new ApiError(409, "Bus with this number already exists");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    let route = await Route.findOne(
      {
        startLocation: { $regex: `^${escapeRegex(startLocationName)}$`, $options: "i" },
        endLocation: { $regex: `^${escapeRegex(endLocationName)}$`, $options: "i" },
      },
      null,
      { session }
    );

if (!route) {
  throw new ApiError(400, "Route not found. Please create the route first with distance and duration.");
}

    const bus = await Bus.create(
      [{
        busNumber,
        amenities: amenities || [],
        Seats,
        startLocation: route._id,
        endLocation: route._id,
      }],
      { session }
    );

    route.buses.push(bus[0]._id);
    await route.save({ session });

    const populatedBus = await Bus.findById(bus[0]._id)
      .populate({
        path: "startLocation endLocation",
        select: "startLocation endLocation date totalDistance totalDuration",
      })
      .session(session);

    await session.commitTransaction();
    await ensureRollingInventoryForBus(bus[0]);
    await invalidateSearchCache();

    if (populatedBus) {
      res.status(201).json(
        new ApiResponse(201, "Bus created successfully", {
          _id: populatedBus._id,
          busNumber: populatedBus.busNumber,
          capacity: populatedBus.capacity,
          amenities: populatedBus.amenities,
          Seats: populatedBus.Seats,
          startLocation: populatedBus.startLocation,
          endLocation: populatedBus.endLocation,
        })
      );
    } else {
      throw new ApiError(400, "Invalid bus data");
    }
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(error.statusCode || 500, error.message || "Error creating bus");
  } finally {
    session.endSession();
  }
});

const getBuses = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  const buses = await Bus.find({})
    .populate({
      path: "startLocation endLocation",
      select: "startLocation endLocation totalDistance totalDuration",
    })
    .lean();

  const Payment = (await import("../models/Payment.model.js")).default;
  const confirmedPayments = await Payment.find({
    status: "confirmed",
  }).select("bus seats").lean();

  const bookedSeatsByBus = new Map();
  confirmedPayments.forEach((p) => {
    const bId = String(p.bus);
    if (!bookedSeatsByBus.has(bId)) bookedSeatsByBus.set(bId, new Set());
    (p.seats || []).forEach((s) => {
      if (s?.seatNumber) bookedSeatsByBus.get(bId).add(String(s.seatNumber).trim().toUpperCase());
    });
  });

  const enrichedBuses = buses.map((bus) => {
    const bookedSet = bookedSeatsByBus.get(String(bus._id)) || new Set();
    const availableSeats = (bus.Seats || []).filter((s) => {
      const num = String(s.SeatNumber).trim().toUpperCase();
      return s.isAvailable !== false && !bookedSet.has(num);
    }).length;
    return {
      ...bus,
      availableSeats,
    };
  });

  res.json(new ApiResponse(200, "Buses retrieved successfully", enrichedBuses));
});

const getBusById = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid bus ID");
  const bus = await Bus.findById(req.params.id).populate({
    path: "startLocation endLocation",
    select: "startLocation endLocation totalDistance totalDuration",
  }).lean();

  if (!bus) {
    throw new ApiError(404, "Bus not found");
  }

  // Cross-reference ALL confirmed bookings for this bus (irrespective of date)
  const Payment = (await import("../models/Payment.model.js")).default;
  const confirmedPayments = await Payment.find({
    bus: req.params.id,
    status: "confirmed",
  }).select("seats").lean();

  const bookedSeatSet = new Set();
  confirmedPayments.forEach((p) => {
    (p.seats || []).forEach((s) => {
      if (s?.seatNumber) bookedSeatSet.add(String(s.seatNumber).trim().toUpperCase());
    });
  });

  if (Array.isArray(bus.Seats)) {
    bus.Seats = bus.Seats.map((seat) => {
      const seatNum = String(seat.SeatNumber).trim().toUpperCase();
      const isBooked = seat.isAvailable === false || bookedSeatSet.has(seatNum);
      return {
        ...seat,
        isAvailable: !isBooked,
      };
    });
  }

  res.json(new ApiResponse(200, "Bus retrieved successfully", bus));
});


const updateBus = asyncHandler(async (req, res) => {
  const busNumber = req.body.busNumber === undefined ? undefined : cleanText(req.body.busNumber, 40);
  const startLocationName = req.body.startLocationName === undefined ? undefined : cleanText(req.body.startLocationName, 100);
  const endLocationName = req.body.endLocationName === undefined ? undefined : cleanText(req.body.endLocationName, 100);
  const { amenities, Seats } = req.body;
  const busId = req.params.id;
  if (!isValidObjectId(busId)) throw new ApiError(400, "Invalid bus ID");

  // Find the bus
  const bus = await Bus.findById(busId);
  if (!bus) {
    throw new ApiError(404, "Bus not found");
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update busNumber if provided and not already taken
if (busNumber && busNumber !== bus.busNumber) {
  const busExists = await Bus.findOne({ busNumber }).session(session);
  if (busExists) {
    throw new ApiError(409, "Bus with this number already exists");
  }
  bus.busNumber = busNumber;
}

    // Update amenities if provided
    if (amenities !== undefined) {
      bus.amenities = amenities;
    }

    // Update Seats if provided
    if (Seats && Array.isArray(Seats)) {
      // Validate seat data
      Seats.forEach((seat) => {
        if (!["Sleeper", "Seater"].includes(seat.Type)) {
          throw new ApiError(400, `Invalid seat type for ${seat.SeatNumber}. Must be "Sleeper" or "Seater"`);
        }
        if (seat.Type === "Seater" && !["Window", "Non-Window"].includes(seat.Seating)) {
          throw new ApiError(400, `Seat ${seat.SeatNumber} (Seater) must have Seating as "Window" or "Non-Window"`);
        }
        if (typeof seat.price !== "number" || seat.price <= 0) {
          throw new ApiError(400, `Seat ${seat.SeatNumber} must have a positive price`);
        }
      });

      // Check for duplicate seat numbers
      const seatNumbers = Seats.map((s) => s.SeatNumber);
      const hasDuplicate = new Set(seatNumbers).size !== seatNumbers.length;
      if (hasDuplicate) {
        throw new ApiError(400, "Duplicate seat numbers within the same bus");
      }

      bus.Seats = Seats;
    }

    // Update route if location names are provided
    if (startLocationName && endLocationName) {
      let route = await Route.findOne(
        {
          startLocation: { $regex: `^${escapeRegex(startLocationName)}$`, $options: "i" },
          endLocation: { $regex: `^${escapeRegex(endLocationName)}$`, $options: "i" },
        },
        null,
        { session }
      );

      if (!route) {
        route = await Route.create(
          [{
            startLocation: startLocationName,
            endLocation: endLocationName,
            totalDistance: 0,
            totalDuration: 0,
          }],
          { session }
        );
        route = route[0];
      }

      bus.startLocation = route._id;
      bus.endLocation = route._id;
    }

    // Save the updated bus
    await bus.save({ session });

    // Populate route details for response
    const populatedBus = await Bus.findById(bus._id)
      .populate({
        path: "startLocation endLocation",
        select: "startLocation endLocation totalDistance totalDuration",
      })
      .session(session);

    // Commit the transaction
    await session.commitTransaction();
    await invalidateSearchCache();

    res.json(new ApiResponse(200, "Bus updated successfully", populatedBus));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(error.statusCode || 500, error.message || "Error updating bus");
  } finally {
    session.endSession();
  }
});


const deleteBus = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid bus ID");
  const bus = await Bus.findById(req.params.id);

  if (bus) {
    await bus.deleteOne();
    await invalidateSearchCache();
    res.json(new ApiResponse(200, "Bus deleted successfully", { _id: req.params.id }));
  } else {
    throw new ApiError(404, "Bus not found");
  }
});


const updateSeatAvailability = asyncHandler(async (req, res) => {                                          
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid bus ID');
  if (typeof req.body.isAvailable !== 'boolean') throw new ApiError(400, 'isAvailable must be boolean');
  const bus = await Bus.findById(req.params.id).select("-amenities -capacity");

  if (bus) {
    const seat = bus.Seats.find(
      seat => seat.SeatNumber === req.params.seatNumber
    );

    if (seat) {
      seat.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : seat.isAvailable;
      const updatedBus = await bus.save();
      await invalidateSearchCache();
      res.json(new ApiResponse(200, 'Seat availability updated successfully', updatedBus));
    } else {
      throw new ApiError(404, 'Seat not found');
    }
  } else {
    throw new ApiError(404, 'Bus not found');
  }
});

const getBusesByLocation = asyncHandler(async (req, res) => {
  const startLocationName = cleanText(req.query.startLocationName, 100);
  const endLocationName = cleanText(req.query.endLocationName, 100);

  if (!startLocationName || !endLocationName) {
    throw new ApiError(400, "startLocationName and endLocationName are required");
  }

  // Find the Route document
  const route = await Route.findOne({
    startLocation: { $regex: `^${escapeRegex(startLocationName)}$`, $options: "i" },
    endLocation: { $regex: `^${escapeRegex(endLocationName)}$`, $options: "i" },
  });

  if (!route) {
    throw new ApiError(404, "Route not found for the specified locations");
  }

  // Find buses for the route
  const buses = await Bus.find({
    $or: [{ startLocation: route._id }, { endLocation: route._id }],
  }).populate({
    path: "startLocation endLocation",
    select: "startLocation endLocation totalDistance totalDuration",
  }).lean();

  res.json(new ApiResponse(200, "Buses retrieved successfully", buses));
});



export {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
  updateSeatAvailability,   // pending
  getBusesByLocation,
};