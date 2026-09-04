import dotenv from "dotenv";
import connectDB from "../src/Db/index.js";
import Payment from "../src/models/Payment.model.js";
import { generateBookingId } from "../src/utils/bookingId.js";

dotenv.config();

try {
  await connectDB();
  const bookings = await Payment.find({ bookingId: { $exists: false } }).sort({ createdAt: 1 });
  for (const booking of bookings) {
    const session = await Payment.startSession();
    try {
      await session.withTransaction(async () => {
        booking.bookingId = await generateBookingId(booking.createdAt, session);
        await booking.save({ session, validateBeforeSave: false });
      });
    } finally {
      await session.endSession();
    }
  }
  console.log(`Booking ID migration complete: ${bookings.length} records updated.`);
  process.exit(0);
} catch (error) {
  console.error("Booking ID migration failed:", error.message);
  process.exit(1);
}
