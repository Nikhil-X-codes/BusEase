import dotenv from "dotenv";
import connectDB from "../src/Db/index.js";
import { cleanupOldInventory, ensureRollingInventory } from "../src/utils/tripInventory.js";

dotenv.config();

try {
  await connectDB();
  const generated = await ensureRollingInventory(30);
  const deleted = await cleanupOldInventory(90);
  console.log(`Inventory maintenance complete: ${generated} upsert operations, ${deleted} old records deleted.`);
  process.exit(0);
} catch (error) {
  console.error("Inventory maintenance failed:", error);
  process.exit(1);
}