import asyncHandler from 'express-async-handler';
import Schedule from '../models/Schedule.model.js';
import Bus from '../models/Bus.model.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// @desc    Create a new schedule
// @route   POST /api/schedules
// @access  Private
const createSchedule = asyncHandler(async (req, res) => {
  const { bus, route, date, boardingTime, arrivalTime } = req.body;

  // Validate bus and route existence
  const busExists = await Bus.findById(bus);
  if (!busExists) {
    throw new ApiError(404, 'Bus not found');
  }

  const routeExists = await Route.findById(route);
  if (!routeExists) {
    throw new ApiError(404, 'Route not found');
  }

  // Check for duplicate schedule (same bus, route, and date)
  const scheduleExists = await Schedule.findOne({ bus, route, date });
  if (scheduleExists) {
    throw new ApiError(400, 'Schedule already exists for this bus, route, and date');
  }

  const schedule = await Schedule.create({
    bus,
    route,
    date,
    boardingTime,
    arrivalTime
  });

  if (schedule) {
    // Populate bus and route for response
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('bus', 'busNumber capacity')
      .populate('route', 'startLocation endLocation');

    res.status(201).json(
      new ApiResponse(201, 'Schedule created successfully', populatedSchedule)
    );
  } else {
    throw new ApiError(400, 'Invalid schedule data');
  }
});

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Public
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({})
    .populate('bus', 'busNumber capacity')
    .populate('route', 'startLocation endLocation');
  res.json(new ApiResponse(200, 'Schedules retrieved successfully', schedules));
});

// @desc    Get single schedule by ID
// @route   GET /api/schedules/:id
// @access  Public
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('bus', 'busNumber capacity')
    .populate('route', 'startLocation endLocation');

  if (schedule) {
    res.json(new ApiResponse(200, 'Schedule retrieved successfully', schedule));
  } else {
    throw new ApiError(404, 'Schedule not found');
  }
});

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (schedule) {
    // Validate bus and route if provided in the update
    if (req.body.bus) {
      const busExists = await Bus.findById(req.body.bus);
      if (!busExists) {
        throw new ApiError(404, 'Bus not found');
      }
    }

    if (req.body.route) {
      const routeExists = await Route.findById(req.body.route);
      if (!routeExists) {
        throw new ApiError(404, 'Route not found');
      }
    }

    // Update fields
    schedule.bus = req.body.bus || schedule.bus;
    schedule.route = req.body.route || schedule.route;
    schedule.date = req.body.date || schedule.date;
    schedule.boardingTime = req.body.boardingTime || schedule.boardingTime;
    schedule.arrivalTime = req.body.arrivalTime || schedule.arrivalTime;

    const updatedSchedule = await schedule.save();

    // Populate bus and route for response
    const populatedSchedule = await Schedule.findById(updatedSchedule._id)
      .populate('bus', 'busNumber capacity')
      .populate('route', 'startLocation endLocation');

    res.json(
      new ApiResponse(200, 'Schedule updated successfully', populatedSchedule)
    );
  } else {
    throw new ApiError(404, 'Schedule not found');
  }
});

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (schedule) {
    await schedule.remove();
    res.json(new ApiResponse(200, 'Schedule removed successfully'));
  } else {
    throw new ApiError(404, 'Schedule not found');
  }
});

export {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule
};