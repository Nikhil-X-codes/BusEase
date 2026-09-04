import dotenv from "dotenv";
import connectDB from "../src/Db/index.js";
import { ensureRollingInventory } from "../src/utils/tripInventory.js";

dotenv.config();

try {
  await connectDB();
  const operations = await ensureRollingInventory(30);
  console.log(`Inventory migration complete: ${operations} upsert operations prepared.`);
  process.exit(0);
} catch (error) {
  console.error("Inventory migration failed:", error);
  process.exit(1);
}