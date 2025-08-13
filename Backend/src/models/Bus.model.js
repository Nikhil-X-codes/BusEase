import mongoose, { Schema } from "mongoose";

const BusSchema = new Schema({
   busNumber:{
    type: String,
    required: true,
    unique: true,
   },
   capacity:{
    type:Number,
   },
   
   amenities:{
    type:[String]
   },

   Seats:{

    SeatNumber:{
        type: String,
        required: true,
        unique: true,
    },

    isAvailable:{
        type: Boolean,
        default: true,
    },

    price:{
        type: Number,
        required: true,
    },

    position:{
        row:{
            type: Number,
            required: true,
        },
        col :{
            type: Number,
            required: true,
        }
    }

   }


},{
    timestamps: true,  
});

export const Bus = mongoose.model("Bus", BusSchema);