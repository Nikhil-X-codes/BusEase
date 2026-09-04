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
		selectedDate: { type: Date },
		endLocation: { type: String },
		amount: {
			type: Number,
			required: true,
		},
		transactionReference: { type: String, required: true, unique: true, index: true },
		bookingId: { type: String, required: true, unique: true, index: true },
		status: { type: String, enum: ["confirmed", "cancelled", "refunded"], default: "confirmed" },
		cancelledAt: { type: Date },
		cancellationReason: { type: String, trim: true, maxlength: 500 },
		refundAmount: { type: Number, min: 0 },
		refundStatus: { type: String, enum: ["not_requested", "simulated", "failed"], default: "not_requested" },
	},
	{
		timestamps: true,
	}
);

PaymentSchema.index({ user: 1, bus: 1, selectedDate: 1 });
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, selectedDate: 1 });
PaymentSchema.index({ bus: 1, selectedDate: 1 });

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;