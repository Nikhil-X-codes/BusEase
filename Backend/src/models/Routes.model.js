import mongoose, { Schema } from "mongoose";
import Bus from "./Bus.model.js";

const RouteSchema = new Schema({
   totalDistance: {
        type: Number,
        default: 0
   },
   totalDuration: {
        type: Number,
    },
    startLocation: {
    type: String,
    required: true,
    },
    endLocation:{
    type: String,
    required: true,
    },
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true}
},{
    timestamps: true,
})

const Route = mongoose.model("Route", RouteSchema);
export default Route;