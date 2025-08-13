import mongoose, { Schema } from "mongoose";

const RouteSchema = new Schema({
   totalDistance: {
        type: Number,
        required: true,
        default: 0
   },
   totalDuration: {
        type: Number,
        required: true,
    },

    startLocation: {
    type: String,
    required: true,
    },

    endLocation:{
    type: String,
    required: true,
    },
    


},{
    timestamps: true,
})

export const Route = mongoose.model("Route", RouteSchema);