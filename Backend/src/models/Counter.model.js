import mongoose, { Schema } from "mongoose";

const CounterSchema = new Schema({
  _id: { type: String },
  value: { type: Number, default: 0 },
}, { timestamps: true });

const Counter = mongoose.model("Counter", CounterSchema);
export default Counter;
