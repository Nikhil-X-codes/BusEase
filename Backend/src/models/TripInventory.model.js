import mongoose, { Schema } from "mongoose";

const InventorySeatSchema = new Schema({
  seatNumber: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ["Sleeper", "Seater"], required: true },
  seating: { type: String, enum: ["Window", "Non-Window"] },
  bookedBy: { type: Schema.Types.ObjectId, ref: "User", select: false },
  reservationReference: { type: String, select: false },
}, { _id: false });

const TripInventorySchema = new Schema({
  bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
  travelDate: { type: Date, required: true },
  seats: { type: [InventorySeatSchema], required: true },
}, { timestamps: true });

TripInventorySchema.index({ bus: 1, travelDate: 1 }, { unique: true });
TripInventorySchema.index({ travelDate: 1 });

const TripInventory = mongoose.model("TripInventory", TripInventorySchema);
export default TripInventory;
