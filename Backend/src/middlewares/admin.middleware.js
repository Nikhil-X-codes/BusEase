import ApiError from "../utils/ApiError.js";
import AuditLog from "../models/AuditLog.model.js";

export const verifyAdmin = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user?.role)) {
    return next(new ApiError(403, "Administrator access required"));
  }
  next();
};

export const verifySuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return next(new ApiError(403, "Superadministrator access required"));
  }
  next();
};

export const checkPermission = (permission) => (req, res, next) => {
  if (req.user?.role === 'superadmin' || req.user?.permissions?.includes(permission)) {
    return next();
  }
  next(new ApiError(403, `Permission required: ${permission}`));
};

export const auditAdminAction = (action, resource) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      AuditLog.create({
        actor: req.user._id,
        action,
        resource,
        resourceId: req.params.id || req.params.userId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      }).catch((error) => console.error('[AUDIT] failed:', error.message));
    }
  });
  next();
};
