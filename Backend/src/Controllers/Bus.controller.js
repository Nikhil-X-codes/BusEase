import asyncHandler from '../utils/Asynchandler.js'
import Bus from '../models/Bus.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Route from '../models/Routes.model.js';

const createBus = asyncHandler(async (req, res) => {
  const { busNumber, capacity, amenities, Seats } = req.body;

  const busExists = await Bus.findOne({ busNumber });
  if (busExists) {
    throw new ApiError(400, 'Bus with this number already exists');
  }


  const bus = await Bus.create({
    busNumber,
    capacity,
    amenities,
    Seats
  });

  const seatNumbers = Seats.map(s => s.SeatNumber);
const hasDuplicate = new Set(seatNumbers).size !== seatNumbers.length;
if (hasDuplicate) {
  throw new ApiError(400, "Duplicate seat numbers within the same bus");
}


  if (bus) {
    res.status(201).json(
      new ApiResponse(201, 'Bus created successfully', {
        _id: bus._id,
        busNumber: bus.busNumber,
        capacity: bus.capacity,
        amenities: bus.amenities,
        Seats: bus.Seats
      })
    );
  } else {
    throw new ApiError(400, 'Invalid bus data');
  }
});

const getBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.find({}).select("-amenities -Seats");
  res.json(new ApiResponse(200, 'Buses retrieved successfully', buses));
});

const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (bus) {
    res.json(new ApiResponse(200, 'Bus retrieved successfully', bus));
  } else {
    throw new ApiError(404, 'Bus not found');
  }
});

const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (bus) {
    bus.busNumber = req.body.busNumber || bus.busNumber;
    bus.capacity = req.body.capacity || bus.capacity;
    bus.amenities = req.body.amenities || bus.amenities;
    bus.Seats = req.body.Seats || bus.Seats;

    const updatedBus = await bus.save();
    res.json(
      new ApiResponse(200, 'Bus updated successfully', {
        _id: updatedBus._id,
        busNumber: updatedBus.busNumber,
        capacity: updatedBus.capacity,
        amenities: updatedBus.amenities,
        Seats: updatedBus.Seats
      })
    );
  } else {
    throw new ApiError(404, 'Bus not found');
  }
});


const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (bus) {
    await Bus.findByIdAndDelete(req.params.id);
    res.json(new ApiResponse(200, 'Bus removed successfully'));
  } else {
    throw new ApiError(404, 'Bus not found');
  }
});


const updateSeatAvailability = asyncHandler(async (req, res) => {
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



export {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
  updateSeatAvailability,
};