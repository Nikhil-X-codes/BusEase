import TripInventory from "../models/TripInventory.model.js";
import Bus from "../models/Bus.model.js";

export const startOfUtcDay = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const seatsFromBus = (bus) => bus.Seats.map((seat) => ({
  seatNumber: seat.SeatNumber,
  isAvailable: seat.isAvailable !== false,
  price: seat.price,
  type: seat.Type,
  seating: seat.Seating,
}));

export const ensureInventory = async (bus, travelDate, session) => {
  const normalizedDate = startOfUtcDay(travelDate);
  let inventoryQuery = TripInventory.findOne({ bus: bus._id, travelDate: normalizedDate });
  if (session) inventoryQuery = inventoryQuery.session(session);
  let inventory = await inventoryQuery;
  if (inventory) return inventory;

  try {
    const created = await TripInventory.create([{
      bus: bus._id,
      travelDate: normalizedDate,
      seats: seatsFromBus(bus),
    }], session ? { session } : undefined);
    return created[0];
  } catch (error) {
    if (error.code !== 11000) throw error;
    let retryQuery = TripInventory.findOne({ bus: bus._id, travelDate: normalizedDate });
    if (session) retryQuery = retryQuery.session(session);
    return retryQuery;
  }
};

export const ensureRollingInventory = async (days = 30) => {
  const buses = await Bus.find({}).select("Seats").lean();
  const today = startOfUtcDay(new Date());
  const operations = [];
  for (const bus of buses) {
    for (let offset = 0; offset < days; offset += 1) {
      const travelDate = new Date(today);
      travelDate.setUTCDate(today.getUTCDate() + offset);
      operations.push({
        updateOne: {
          filter: { bus: bus._id, travelDate },
          update: { $setOnInsert: { bus: bus._id, travelDate, seats: seatsFromBus(bus, offset === 0) } },
          upsert: true,
        },
      });
    }
  }
  if (operations.length) await TripInventory.bulkWrite(operations, { ordered: false });
  return operations.length;
};

export const ensureRollingInventoryForBus = async (bus, days = 30) => {
  const today = startOfUtcDay(new Date());
  const operations = [];
  for (let offset = 0; offset < days; offset += 1) {
    const travelDate = new Date(today);
    travelDate.setUTCDate(today.getUTCDate() + offset);
    operations.push({
      updateOne: {
        filter: { bus: bus._id, travelDate },
        update: { $setOnInsert: { bus: bus._id, travelDate, seats: seatsFromBus(bus) } },
        upsert: true,
      },
    });
  }
  if (operations.length) await TripInventory.bulkWrite(operations, { ordered: false });
  return operations.length;
};

export const cleanupOldInventory = async (days = 90) => {
  const cutoff = startOfUtcDay(new Date());
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const result = await TripInventory.deleteMany({ travelDate: { $lt: cutoff } });
  return result.deletedCount || 0;
};
