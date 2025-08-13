import mongoose, { Schema } from "mongoose";

const ScheduleSchema = new Schema({

  bus:{
    type: Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },

  route:{
    type: Schema.Types.ObjectId,
    ref: "Route",
    required: true
  },

  date:{
    type: Date,
    required: true
  },

  boardingTime:{
    type: String,
    required: true
  },
  
  arrivalTime:{
    type: String,
    required: true
  },

},{
    timestamps: true,
})

export const Schedule = mongoose.model("Schedule", ScheduleSchema);