import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asynchandler from '../utils/Asynchandler.js'
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import { generateOTP,
    sendOTPEmail,
    transporter} 
    
    from "../utils/Nodemailer.js";


const registeruser = asynchandler(async (req,res) => {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
    }

    const newUser = await User.create({
        username: username,
        email,
        password,
    });

    if (!newUser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(new ApiResponse(201, "User registered successfully", newUser));
})

const loginuser = asynchandler(async (req, res) => {                                   
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    const existinguser = await User.findOne({ email });

    if (!existinguser) {
        return registeruser(req, res); 
    }

    const isPasswordValid = await existinguser.isPasswordmatch(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const {accessToken,refreshToken } = await generateAccessAndRefreshTokens(existinguser._id);

    const loggedInUser = await User.findById(existinguser._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };

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
                    accessToken,
                    refreshToken
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
        return res.status(400).json({ message: "Old password and new password are required" });
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
    const user = await User.findById(req.user?._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User profile fetched successfully", user));
});


const updateProfile = asynchandler(async (req, res) => {
    const { username, email } = req.body;

    if (!username && !email) {
        return res.status(400).json({ message: "At least one field is required to update" });
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;

    if (email) {
        const existingUser = await User.findOne({ 
            email: email,
            _id: { $ne: req.user._id }
        });
        
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
    ).select("-password -refreshToken");

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
      secure: true
    };

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(new ApiResponse(200,"Tokens refreshed successfully", { accessToken: newAccessToken, refreshToken: newRefreshToken }));
  } 
  
  catch (error) {
    next(error); 
  }})    


const sendPasswordResetOTP = asynchandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
        throw new ApiError(404, "User with this email does not exist");
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
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP and new password are required" });
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


