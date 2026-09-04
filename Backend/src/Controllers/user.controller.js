import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asynchandler from '../utils/Asynchandler.js'
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import { generateOTP,
    sendOTPEmail,
    sendWelcomeEmail,
} 
    
    from "../utils/Nodemailer.js";
import { cleanText, isStrongPassword, isValidEmail } from "../utils/validation.js";
import { clearFailedLogins, isAccountLocked, recordFailedLogin } from "../middlewares/rateLimit.middleware.js";


const registeruser = asynchandler(async (req,res) => {
    const startTimeNs = process.hrtime.bigint();

    const username = cleanText(req.body.username, 60);
    const email = cleanText(req.body.email, 254).toLowerCase();
    const { password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "Username, email, and password are required");
    }
    if (!isValidEmail(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }
    if (isAccountLocked(email)) {
        throw new ApiError(429, "Account temporarily locked after repeated failed attempts. Please try again later.");
    }
    if (!isStrongPassword(password)) {
        throw new ApiError(400, "Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }

    const findStart = process.hrtime.bigint();
    const existingUser = await User.findOne({ email }).lean().select('_id');
    const findMs = Number(process.hrtime.bigint() - findStart) / 1e6;
    if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
    }

    const createStart = process.hrtime.bigint();
    const newUser = await User.create({
        username: username,
        email,
        password,
    });
    const createMs = Number(process.hrtime.bigint() - createStart) / 1e6;

    if (!newUser) {
        throw new ApiError(500, "Failed to create user");
    }

    const totalMs = Number(process.hrtime.bigint() - startTimeNs) / 1e6;
    console.log(`[AUTH][REGISTER] email=${email} findMs=${findMs.toFixed(1)} createMs=${createMs.toFixed(1)} totalMs=${totalMs.toFixed(1)}`);
    const safeUser = newUser.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;
    delete safeUser.resetPasswordOTP;
    delete safeUser.resetPasswordOTPExpires;
    await sendWelcomeEmail(email, username).catch((error) => console.error("[EMAIL] welcome email failed:", error.message));
    return res.status(201).json(new ApiResponse(201, "User registered successfully", safeUser));
})

const loginuser = asynchandler(async (req, res) => {                                   
    const startTimeNs = process.hrtime.bigint();
    const email = cleanText(req.body.email, 254).toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    if (!isValidEmail(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }
    const findStart = process.hrtime.bigint();
    const existinguser = await User.findOne({ email });
    const findMs = Number(process.hrtime.bigint() - findStart) / 1e6;

    if (!existinguser) {
        recordFailedLogin(email);
        throw new ApiError(401, "Invalid email or password");
    }
    if (existinguser.isActive === false) {
        throw new ApiError(401, "Account is inactive");
    }

    const bcryptStart = process.hrtime.bigint();
    const isPasswordValid = await existinguser.isPasswordmatch(password);
    const bcryptMs = Number(process.hrtime.bigint() - bcryptStart) / 1e6;

    if (!isPasswordValid) {
        recordFailedLogin(email);
        throw new ApiError(401, "Invalid email or password");
    }
    clearFailedLogins(email);
    existinguser.lastLoginAt = new Date();
    existinguser.lastActivityAt = new Date();
    await existinguser.save({ validateBeforeSave: false });

    const tokenStart = process.hrtime.bigint();
    const {accessToken,refreshToken } = await generateAccessAndRefreshTokens(existinguser._id);
    const tokenMs = Number(process.hrtime.bigint() - tokenStart) / 1e6;

    const profileStart = process.hrtime.bigint();
    const loggedInUser = existinguser.toObject();
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;
    delete loggedInUser.resetPasswordOTP;
    delete loggedInUser.resetPasswordOTPExpires;
    const profileMs = Number(process.hrtime.bigint() - profileStart) / 1e6;

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };

    const totalMs = Number(process.hrtime.bigint() - startTimeNs) / 1e6;
    console.log(`[AUTH][LOGIN] email=${email} findMs=${findMs.toFixed(1)} bcryptMs=${bcryptMs.toFixed(1)} tokenMs=${tokenMs.toFixed(1)} profileMs=${profileMs.toFixed(1)} totalMs=${totalMs.toFixed(1)}`);
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                 "User logged in successfully",
                {
                    user: loggedInUser,
                },
               
            )
        );
});

const logoutuser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

const changepassword = asynchandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }
    if (!isStrongPassword(newPassword)) {
        throw new ApiError(400, "Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }

    const user = await User.findById(req.user?._id);
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordmatch(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully"));
});

const getuserProfile = asynchandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpires");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User profile fetched successfully", user));
});


const updateProfile = asynchandler(async (req, res) => {
    const username = req.body.username === undefined ? undefined : cleanText(req.body.username, 60);
    const email = req.body.email === undefined ? undefined : cleanText(req.body.email, 254).toLowerCase();

    if (!username && !email) {
        throw new ApiError(400, "At least one valid field is required to update");
    }
    if (email && !isValidEmail(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;

    if (email) {
        const existingUser = await User.findOne({ 
            email: email,
            _id: { $ne: req.user._id }
        }).lean().select('_id');
        
        if (existingUser) {
            return res.status(409).json({ message: "Email already exists" });
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateFields,
        {
            new: true,
            runValidators: true
        }
    ).select("-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpires");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user profile");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Profile updated successfully", updatedUser));
});

const generateAccessAndRefreshTokens = async (userId) => {                      
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken,refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const refreshAccessToken = asynchandler(async (req, res, next) => {          
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    if (!refreshTokenFromCookie) {
      throw new ApiError(401, "Please login to continue");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken?.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.refreshToken || user.refreshToken !== refreshTokenFromCookie) {
      throw new ApiError(401, "Refresh token mismatch");
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
            secure: true,
            sameSite: 'none'
    };

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(new ApiResponse(200,"Tokens refreshed successfully"));
  } 
  
  catch (error) {
    next(error); 
  }})    


const sendPasswordResetOTP = asynchandler(async (req, res) => {
    const email = cleanText(req.body.email, 254).toLowerCase();

    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    if (!isValidEmail(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    const user = await User.findOne({ email }).select('_id email resetPasswordOTP resetPasswordOTPExpires');
    
    if (!user) {
        return res
            .status(200)
            .json(new ApiResponse(200, "If the account exists, a password reset OTP has been sent"));
    }

    const otp = generateOTP();
    
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    try {
        await sendOTPEmail(email, otp);
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Password reset OTP sent to your email"));
    } catch (error) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();
        
        throw new ApiError(500, "Failed to send OTP email");
    }
});


const resetPasswordWithOTP = asynchandler(async (req, res) => {
    const email = cleanText(req.body.email, 254).toLowerCase();
    const otp = cleanText(req.body.otp, 6);
    const { newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Email, OTP, and new password are required");
    }
    if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
        throw new ApiError(400, "Please provide a valid email and 6-digit OTP");
    }
    if (!isStrongPassword(newPassword)) {
        throw new ApiError(400, "Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }

    const user = await User.findOne({ 
        email,
        resetPasswordOTP: otp,
        resetPasswordOTPExpires: { $gt: Date.now() }
    });
    
    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Password reset successfully"));
});


export {
  registeruser,
  loginuser,
  logoutuser,
    changepassword,
    getuserProfile,
    updateProfile,
    refreshAccessToken,
    sendPasswordResetOTP,
    resetPasswordWithOTP,
}


