import asyncHandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import { cleanText, escapeRegex, isStrongPassword, isValidEmail, isValidObjectId } from "../utils/validation.js";

const safeAdmin = (user) => {
  const data = user.toObject ? user.toObject() : user;
  delete data.password;
  delete data.refreshToken;
  delete data.resetPasswordOTP;
  delete data.resetPasswordOTPExpires;
  delete data.passwordHistory;
  return data;
};

export const listAdmins = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = { role: { $in: ['admin', 'superadmin'] } };
  if (req.query.role && ['admin', 'superadmin'].includes(req.query.role)) filter.role = req.query.role;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  if (req.query.lastLoginBefore) filter.lastLoginAt = { $lt: new Date(req.query.lastLoginBefore) };
  if (req.query.lastLoginAfter) filter.lastLoginAt = { ...(filter.lastLoginAt || {}), $gt: new Date(req.query.lastLoginAfter) };
  if (req.query.search) {
    const search = cleanText(req.query.search, 100);
    const safeSearch = escapeRegex(search);
    filter.$or = [{ username: { $regex: safeSearch, $options: 'i' } }, { email: { $regex: safeSearch, $options: 'i' } }];
  }
  const [admins, total] = await Promise.all([
    User.find(filter).select('-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpires -passwordHistory').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, "Administrators retrieved successfully", { admins, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const createAdmin = asyncHandler(async (req, res) => {
  const username = cleanText(req.body.username, 60);
  const email = cleanText(req.body.email, 254).toLowerCase();
  const password = req.body.password;
  const role = req.body.role;
  if (!username || !isValidEmail(email) || !isStrongPassword(password) || password.length < 12 || !['admin', 'superadmin'].includes(role)) {
    throw new ApiError(400, "Admin requires a valid email, a role, and a password of at least 12 characters with uppercase, lowercase, and a number");
  }
  if (await User.exists({ email })) throw new ApiError(409, "User with this email already exists");
  const admin = await User.create({ username, email, password, role, forcePasswordChange: true, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, "Administrator created successfully", safeAdmin(admin)));
});

export const deactivateAdmin = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid administrator ID");
  const admin = await User.findOne({ _id: req.params.id, role: { $in: ['admin', 'superadmin'] } });
  if (!admin) throw new ApiError(404, "Administrator not found");
  if (admin.role === 'superadmin' && await User.countDocuments({ role: 'superadmin', isActive: true }) <= 1) {
    throw new ApiError(409, "The last active superadministrator cannot be deactivated");
  }
  admin.isActive = false;
  admin.refreshToken = undefined;
  await admin.save({ validateBeforeSave: false });
  res.json(new ApiResponse(200, "Administrator deactivated successfully", { _id: admin._id }));
});
