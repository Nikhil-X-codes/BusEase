import mongoose, { Schema } from "mongoose";

const RouteSchema = new Schema({
  totalDistance: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number,
    default: 0,
  },
  startLocation: {
    type: String,
    required: true,
  },
  endLocation: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  buses: [{ 
    type: Schema.Types.ObjectId,
    ref: "Bus",
  }],
}, {
  timestamps: true,
});

RouteSchema.index({ startLocation: 1, endLocation: 1, date: 1 }); 

const Route = mongoose.model("Route", RouteSchema);
export default Route;