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

  From:{
    type: String,
    required: true
  },
  
  To:{
    type: String,
    required: true
  },

},{
    timestamps: true,
})

const Schedule = mongoose.model("Schedule", ScheduleSchema);
export default Schedule;