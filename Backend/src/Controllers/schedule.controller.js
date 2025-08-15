import asyncHandler from '../utils/Asynchandler.js';
import Schedule from '../models/Schedule.model.js';
import Bus from '../models/Bus.model.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';


const createSchedule = asyncHandler(async (req, res) => {
  const { bus, route, date, From ,To } = req.body;

  const busExists = await Bus.findById(bus);
  if (!busExists) {
    throw new ApiError(404, 'Bus not found');
  }

  const routeExists = await Route.findById(route);
  if (!routeExists) {
    throw new ApiError(404, 'Route not found');
  }

  const scheduleExists = await Schedule.findOne({ bus, route, date });
  if (scheduleExists) {
    throw new ApiError(400, 'Schedule already exists for this bus, route, and date');
  }

  const schedule = await Schedule.create({
    bus,
    route,
    date,
    From,
    To
  });

  if (schedule) {

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


const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({})
    .populate('bus', 'busNumber capacity')
    .populate('route', 'startLocation endLocation');
  res.json(new ApiResponse(200, 'Schedules retrieved successfully', schedules));
});


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


const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (schedule) {
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


    schedule.bus = req.body.bus || schedule.bus;
    schedule.route = req.body.route || schedule.route;
    schedule.date = req.body.date || schedule.date;
    schedule.From = req.body.From || schedule.From;
    schedule.To = req.body.To || schedule.To;

    const updatedSchedule = await schedule.save();

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


const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (schedule) {
    await schedule.deleteOne();
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