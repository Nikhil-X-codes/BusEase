import mongoose, { Schema } from "mongoose";

const PaymentSchema = new Schema({
  
    user:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

cardDetails: {
    cardNumber: { type: String, required: true },
    cardHolderName: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true }
},

    amount:{
        type: Number,
        required: true,
    },


},{
    timestamps: true,
})

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;