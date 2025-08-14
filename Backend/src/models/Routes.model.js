import mongoose, { Schema } from "mongoose";

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
    


},{
    timestamps: true,
})

 const Route = mongoose.model("Route", RouteSchema);
 export default Route;