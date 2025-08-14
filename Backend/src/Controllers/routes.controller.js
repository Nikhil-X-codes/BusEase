import asyncHandler from '../utils/Asynchandler.js';
import Route from '../models/Routes.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';


const createRoute = asyncHandler(async (req, res) => {
  const { startLocation, endLocation } = req.body;

  if (!startLocation || !endLocation) {
    throw new ApiError(400, 'Start location and end location are required');
  }

  const routeExists = await Route.findOne({ startLocation, endLocation });
  if (routeExists) {
    throw new ApiError(400, 'Route with this start and end location already exists');
  }

  const route = await Route.create({
    startLocation,
    endLocation
  });

  if (route) {
    res.status(201).json(
      new ApiResponse(201, 'Route created successfully', {
        _id: route._id,
        startLocation: route.startLocation,
        endLocation: route.endLocation
      })
    );
  } else {
    throw new ApiError(400, 'Invalid route data');
  }
});


const getRouteById = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id).select('-totalDistance');

  if (route) {
    res.json(new ApiResponse(200, 'Route retrieved successfully', route));
  } else {
    throw new ApiError(404, 'Route not found');
  }
});

const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);

  if (route) {
    if (req.body.startLocation || req.body.endLocation) {
      const newStart = req.body.startLocation || route.startLocation;
      const newEnd = req.body.endLocation || route.endLocation;
      
      const duplicateRoute = await Route.findOne({ 
        startLocation: newStart, 
        endLocation: newEnd,
        _id: { $ne: route._id } 
      });
      
      if (duplicateRoute) {
        throw new ApiError(400, 'Route with this start and end location already exists');
      }
    }

    route.startLocation = req.body.startLocation || route.startLocation;
    route.endLocation = req.body.endLocation || route.endLocation;

    const updatedRoute = await route.save();
    res.json(
      new ApiResponse(200, 'Route updated successfully', {
        _id: updatedRoute._id,
        startLocation: updatedRoute.startLocation,
        endLocation: updatedRoute.endLocation
      })
    );
  } else {
    throw new ApiError(404, 'Route not found');
  }
});


const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);

  if (route) {
    await Route.findByIdAndDelete(req.params.id);
    res.json(new ApiResponse(200, 'Route removed successfully'));
  } else {
    throw new ApiError(404, 'Route not found');
  }
});


const searchRoutes = asyncHandler(async (req, res) => {
  const { startLocation, endLocation } = req.query;

  let query = {};
  
  if (startLocation) {
    query.startLocation = { $regex: startLocation, $options: 'i' }; 
  }
  
  if (endLocation) {
    query.endLocation = { $regex: endLocation, $options: 'i' };
  }

  if (Object.keys(query).length === 0) {
    throw new ApiError(400, 'Please provide startLocation or endLocation to search');
  }

  const routes = await Route.find(query).select('-totalDistance');
  res.json(new ApiResponse(200, 'Routes found', routes));
});

export {
  createRoute,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchRoutes
};