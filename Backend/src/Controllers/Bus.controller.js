import asyncHandler from '../utils/Asynchandler.js'
import Bus from '../models/Bus.model.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import mongoose from 'mongoose';


const createBus = asyncHandler(async (req, res) => {
  const { busNumber, amenities, Seats, startLocationName, endLocationName } = req.body;

  // Validate required fields
  if (!busNumber || !Seats || !Array.isArray(Seats) || !startLocationName || !endLocationName) {
    throw new ApiError(400, "Bus number, seats (array), startLocationName, and endLocationName are required");
  }

  // Validate seat data
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

  // Check for duplicate seat numbers
  const seatNumbers = Seats.map((s) => s.SeatNumber);
  const hasDuplicate = new Set(seatNumbers).size !== seatNumbers.length;
  if (hasDuplicate) {
    throw new ApiError(400, "Duplicate seat numbers within the same bus");
  }

  // Check if bus with this number already exists
  const busExists = await Bus.findOne({ busNumber });
  if (busExists) {
    throw new ApiError(400, "Bus with this number already exists");
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find or create Route document
    let route = await Route.findOne(
      {
        startLocation: { $regex: `^${startLocationName}$`, $options: "i" },
        endLocation: { $regex: `^${endLocationName}$`, $options: "i" },
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
          buses: [],
        }],
        { session }
      );
      route = route[0];
    }

    // Create the bus
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

    // Add bus to route's buses array
    route.buses.push(bus[0]._id);
    await route.save({ session });

    // Populate route details for response
    const populatedBus = await Bus.findById(bus[0]._id)
      .populate({
        path: "startLocation endLocation",
        select: "startLocation endLocation date totalDistance totalDuration",
      })
      .session(session);

    await session.commitTransaction();

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
  const buses = await Bus.find({})
    .select("-amenities -Seats")
    .populate({
      path: "startLocation endLocation",
      select: "startLocation endLocation totalDistance totalDuration",
    });

  res.json(new ApiResponse(200, "Buses retrieved successfully", buses));
});

const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id).populate({
    path: "startLocation endLocation",
    select: "startLocation endLocation totalDistance totalDuration",
  });

  if (bus) {
    res.json(new ApiResponse(200, "Bus retrieved successfully", bus));
  } else {
    throw new ApiError(404, "Bus not found");
  }
});


const updateBus = asyncHandler(async (req, res) => {
  const { busNumber, amenities, Seats, startLocationName, endLocationName } = req.body;
  const busId = req.params.id;

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
    throw new ApiError(400, "Bus with this number already exists");
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
          startLocation: { $regex: `^${startLocationName}$`, $options: "i" },
          endLocation: { $regex: `^${endLocationName}$`, $options: "i" },
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

    res.json(new ApiResponse(200, "Bus updated successfully", populatedBus));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(error.statusCode || 500, error.message || "Error updating bus");
  } finally {
    session.endSession();
  }
});


const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (bus) {
    await bus.deleteOne();
    res.json(new ApiResponse(200, "Bus deleted successfully", { _id: req.params.id }));
  } else {
    throw new ApiError(404, "Bus not found");
  }
});


const updateSeatAvailability = asyncHandler(async (req, res) => {                                           // pending
  const bus = await Bus.findById(req.params.id).select("-amenities -capacity");

  if (bus) {
    const seat = bus.Seats.find(
      seat => seat.SeatNumber === req.params.seatNumber
    );

    if (seat) {
      seat.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : seat.isAvailable;
      const updatedBus = await bus.save();
      res.json(new ApiResponse(200, 'Seat availability updated successfully', updatedBus));
    } else {
      throw new ApiError(404, 'Seat not found');
    }
  } else {
    throw new ApiError(404, 'Bus not found');
  }
});

const getBusesByLocation = asyncHandler(async (req, res) => {
  const { startLocationName, endLocationName } = req.query;

  if (!startLocationName || !endLocationName) {
    throw new ApiError(400, "startLocationName and endLocationName are required");
  }

  // Find the Route document
  const route = await Route.findOne({
    startLocation: { $regex: `^${startLocationName}$`, $options: "i" },
    endLocation: { $regex: `^${endLocationName}$`, $options: "i" },
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
  });

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