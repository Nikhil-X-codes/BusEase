import asynchandler from '../utils/Asynchandler.js'
import Trip from '../models/Trip.model.js';
import Schedule from '../models/Schedule.model.js';
import Bus from '../models/Bus.model.js';
import Route from '../models/Route.modeljs';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
const createTrip = asyncHandler(async (req, res) => {
  const { schedule, bus, route, availableSeats, bookedSeats, seatavaiable } = req.body;

  // Validate schedule, bus, and route existence
  const scheduleExists = await Schedule.findById(schedule);
  if (!scheduleExists) {
    throw new ApiError(404, 'Schedule not found');
  }

  const busExists = await Bus.findById(bus);
  if (!busExists) {
    throw new ApiError(404, 'Bus not found');
  }

  const routeExists = await Route.findById(route);
  if (!routeExists) {
    throw new ApiError(404, 'Route not found');
  }

  // Ensure the bus and route match the schedule
  if (scheduleExists.bus.toString() !== bus || scheduleExists.route.toString() !== route) {
    throw new ApiError(400, 'Bus and route must match the schedule');
  }

  // Validate availableSeats against bus capacity
  if (availableSeats > busExists.capacity) {
    throw new ApiError(400, 'Available seats cannot exceed bus capacity');
  }

  // Check for duplicate trip (same schedule)
  const tripExists = await Trip.findOne({ schedule });
  if (tripExists) {
    throw new ApiError(400, 'Trip already exists for this schedule');
  }

  const trip = await Trip.create({
    schedule,
    bus,
    route,
    availableSeats,
    bookedSeats,
    seatavaiable
  });

  if (trip) {
    // Populate schedule, bus, and route for response
    const populatedTrip = await Trip.findById(trip._id)
      .populate('schedule', 'date boardingTime arrivalTime')
      .populate('bus', 'busNumber capacity')
      .populate('route', 'startLocation endLocation');

    res.status(201).json(
      new ApiResponse(201, 'Trip created successfully', populatedTrip)
    );
  } else {
    throw new ApiError(400, 'Invalid trip data');
  }
});

// @desc    Get all trips
// @route   GET /api/trips
// @access  Public
const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({})
    .populate('schedule', 'date boardingTime arrivalTime')
    .populate('bus', 'busNumber capacity')
    .populate('route', 'startLocation endLocation');
  res.json(new ApiResponse(200, 'Trips retrieved successfully', trips));
});

// @desc    Get single trip by ID
// @route   GET /api/trips/:id
// @access  Public
const getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('schedule', 'date boardingTime arrivalTime')
    .populate('bus', 'busNumber capacity')
    .populate('route', 'startLocation endLocation');

  if (trip) {
    res.json(new ApiResponse(200, 'Trip retrieved successfully', trip));
  } else {
    throw new ApiError(404, 'Trip not found');
  }
});

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (trip) {
    // Validate schedule, bus, and route if provided
    if (req.body.schedule) {
      const scheduleExists = await Schedule.findById(req.body.schedule);
      if (!scheduleExists) {
        throw new ApiError(404, 'Schedule not found');
      }
      // Ensure bus and route match the new schedule
      if (req.body.bus && req.body.route) {
        if (
          scheduleExists.bus.toString() !== req.body.bus ||
          scheduleExists.route.toString() !== req.body.route
        ) {
          throw new ApiError(400, 'Bus and route must match the schedule');
        }
      }
    }

    if (req.body.bus) {
      const busExists = await Bus.findById(req.body.bus);
      if (!busExists) {
        throw new ApiError(404, 'Bus not found');
      }
      // Validate availableSeats against new bus capacity
      if (req.body.availableSeats && req.body.availableSeats > busExists.capacity) {
        throw new ApiError(400, 'Available seats cannot exceed bus capacity');
      }
    }

    if (req.body.route) {
      const routeExists = await Route.findById(req.body.route);
      if (!routeExists) {
        throw new ApiError(404, 'Route not found');
      }
    }

    // Update fields
    trip.schedule = req.body.schedule || trip.schedule;
    trip.bus = req.body.bus || trip.bus;
    trip.route = req.body.route || trip.route;
    trip.availableSeats = req.body.availableSeats !== undefined ? req.body.availableSeats : trip.availableSeats;
    trip.bookedSeats = req.body.bookedSeats || trip.bookedSeats;
    trip.seatavaiable = req.body.seatavaiable || trip.seatavaiable;

    const updatedTrip = await trip.save();

    // Populate schedule, bus, and route for response
    const populatedTrip = await Trip.findById(updatedTrip._id)
      .populate('schedule', 'date boardingTime arrivalTime')
      .populate('bus', 'busNumber capacity')
      .populate('route', 'startLocation endLocation');

    res.json(
      new ApiResponse(200, 'Trip updated successfully', populatedTrip)
    );
  } else {
    throw new ApiError(404, 'Trip not found');
  }
});

// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (trip) {
    await trip.remove();
    res.json(new ApiResponse(200, 'Trip removed successfully'));
  } else {
    throw new ApiError(404, 'Trip not found');
  }
});

// @desc    Book a seat for a trip
// @route   PUT /api/trips/:id/book-seat
// @access  Private
const bookSeat = asyncHandler(async (req, res) => {
  const { seatNumber } = req.body;
  const trip = await Trip.findById(req.params.id);

  if (trip) {
    const seat = trip.seatavaiable.find(seat => seat.seatNumber === seatNumber);

    if (!seat) {
      throw new ApiError(404, 'Seat not found');
    }

    if (seat.isBooked) {
      throw new ApiError(400, 'Seat is already booked');
    }

    if (trip.availableSeats <= 0) {
      throw new ApiError(400, 'No available seats left');
    }

    // Update seat status
    seat.isBooked = true;
    trip.availableSeats -= 1;
    trip.bookedSeats.push(seat.seatNumber);

    const updatedTrip = await trip.save();

    // Populate schedule, bus, and route for response
    const populatedTrip = await Trip.findById(updatedTrip._id)
      .populate('schedule', 'date boardingTime arrivalTime')
      .populate('bus', 'busNumber capacity')
      .populate('route', 'startLocation endLocation');

    res.json(
      new ApiResponse(200, 'Seat booked successfully', populatedTrip)
    );
  } else {
    throw new ApiError(404, 'Trip not found');
  }
});

export {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  bookSeat
};