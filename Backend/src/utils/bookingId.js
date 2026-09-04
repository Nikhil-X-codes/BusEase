import Counter from "../models/Counter.model.js";

const dateKey = (date) => {
  const value = new Date(date);
  return value.toISOString().slice(0, 10).replaceAll("-", "");
};

export const generateBookingId = async (date, session) => {
  const key = `booking:${dateKey(date)}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `BUE-${key.slice(-8)}-${String(counter.value).padStart(4, "0")}`;
};
