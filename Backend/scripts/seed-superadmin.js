import dotenv from "dotenv";
import connectDB from "../src/Db/index.js";
import User from "../src/models/User.model.js";
import { isStrongPassword, isValidEmail } from "../src/utils/validation.js";

dotenv.config();

const { SUPERADMIN_USERNAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
if (!SUPERADMIN_USERNAME || !isValidEmail(SUPERADMIN_EMAIL) || !SUPERADMIN_PASSWORD || SUPERADMIN_PASSWORD.length < 12 || !isStrongPassword(SUPERADMIN_PASSWORD)) {
  throw new Error("SUPERADMIN_USERNAME, valid SUPERADMIN_EMAIL, and a complex SUPERADMIN_PASSWORD of at least 12 characters are required");
}

try {
  await connectDB();
  const existing = await User.findOne({ email: SUPERADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.role = "superadmin";
    existing.isActive = true;
    await existing.save();
    console.log("Existing user promoted to superadmin.");
  } else {
    await User.create({
      username: SUPERADMIN_USERNAME,
      email: SUPERADMIN_EMAIL.toLowerCase(),
      password: SUPERADMIN_PASSWORD,
      role: "superadmin",
      isActive: true,
    });
    console.log("Superadmin created.");
  }
  process.exit(0);
} catch (error) {
  console.error("Superadmin seed failed:", error.message);
  process.exit(1);
}
