import ApiError from '../utils/ApiError.js';

export const requireAdmin = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user?.role)) {
    return next(new ApiError(403, 'Administrator access required'));
  }
  next();
};