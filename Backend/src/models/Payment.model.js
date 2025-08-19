import mongoose, { Schema } from "mongoose";

const BookedSeatSchema = new Schema({
	seatNumber: { type: String, required: true },
	price: { type: Number, required: true },
	type: { type: String, enum: ["Sleeper", "Seater"], required: true },
});

const PaymentSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		bus: {
			type: Schema.Types.ObjectId,
			ref: "Bus",
			required: true,
		},
		seats: [BookedSeatSchema],
		startLocation: { type: String },
		endLocation: { type: String },
		amount: {
			type: Number,
			required: true,
		},
		cardDetails: {
			cardNumber: { type: String, required: true },
			cardHolderName: { type: String, required: true },
			expiryDate: { type: String, required: true },
			cvv: { type: String, required: true },
		},
	},
	{
		timestamps: true,
	}
);

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;