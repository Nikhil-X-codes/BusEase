import jwt from "jsonwebtoken"
import asynchandler from "../utils/Asynchandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.model.js";


export const verifyJWT = asynchandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        } 
        catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError(401, "Access token expired");
            }
            throw new ApiError(401, "Invalid access token");
        }

        const user = await User.findById(decodedToken?.id).select("-password -refreshToken -passwordHistory");
        if (!user) {
            throw new ApiError(401, "User not found");
        }
        if (user.isActive === false) {
            throw new ApiError(401, "Account is inactive");
        }
        if (['admin', 'superadmin'].includes(user.role)) {
            const inactivityLimit = 30 * 60 * 1000;
            if (user.lastActivityAt && Date.now() - user.lastActivityAt.getTime() > inactivityLimit) {
                await User.updateOne({ _id: user._id }, { $unset: { refreshToken: 1 } });
                throw new ApiError(401, "Admin session expired due to inactivity");
            }
            await User.updateOne({ _id: user._id }, { $set: { lastActivityAt: new Date() } });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error); 
    }
});