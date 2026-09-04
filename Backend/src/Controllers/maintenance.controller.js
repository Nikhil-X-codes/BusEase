import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { cleanupOldInventory, ensureRollingInventory } from "../utils/tripInventory.js";

export const maintainInventory = asyncHandler(async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = req.header("Authorization");
  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    throw new ApiError(401, "Unauthorized maintenance request");
  }

  const generated = await ensureRollingInventory(30);
  const deleted = await cleanupOldInventory(90);
  res.json(new ApiResponse(200, "Inventory maintenance completed", { generated, deleted }));
});
