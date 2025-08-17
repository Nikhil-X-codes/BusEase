import mongoose, { Schema } from "mongoose";

const SeatSchema = new Schema({
  SeatNumber: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    required: true,
  },
  Type: {
    type: String,
    required: true,
    enum: ["Sleeper", "Seater"],
  },
  Seating: {
    type: String,
    enum: ["Window", "Non-Window"],
    required: function () {
      return this.Type === "Seater";
    },
  },
});

const BusSchema = new Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
    },
    amenities: {
      type: [String],
    },
    Seats: [SeatSchema],
  },
  {
    timestamps: true,
  }
);

BusSchema.pre("save", function (next) {
  this.Seats.forEach((seat) => {
    if (seat.Type === "Sleeper") {
      seat.Seating = undefined;
    }
  });
  
  // Auto-calculate capacity from seats
  this.capacity = this.Seats.length;
  
  next();
});

const Bus = mongoose.model("Bus", BusSchema);
export default Bus;