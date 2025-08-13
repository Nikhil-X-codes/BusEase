import mongoose, { Schema } from "mongoose";

const TripSchema = new Schema({
 
    schedule:{
        type: Schema.Types.ObjectId,
        ref: 'Schedule',
        required: true
    },

    bus:{
        type: Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    
    route:{
        type: Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    availableSeats: {
        type: Number,
        required: true,
        default: 0
    },

    BookedSeats: {
        type: [Number],
        default: []
    },

    Seatavaiable:{

        seatNumber:{
           type:String,
            required: true
        },

        isBooked:{
            type: Boolean,
            default: false
        },
        
        price:{
            type: Number,
            required: true
        },

    },

},{
    timestamps: true,
})