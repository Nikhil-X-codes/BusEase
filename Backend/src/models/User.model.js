import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userschema=new Schema({
    username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index:true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20,
    index: true
  },
    password: {
    type: String,
    required: [true, 'Password is required']
  },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user',
        index: true
    },
  permissions: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLoginAt: Date,
  lastActivityAt: Date,
  forcePasswordChange: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  passwordHistory: {
    type: [String],
    select: false,
    default: []
  },
  refreshToken: {
    type: String,
    index: true
  },
  gender:{
    type: String,
    enum: ['male','female']
  },
    resetPasswordOTP: {
        type: String
    },
    resetPasswordOTPExpires: {
        type: Date
    }

},{
    timestamps: true,
});

// Index for OTP-based password reset queries
userschema.index({ resetPasswordOTPExpires: 1 }, { sparse: true });
userschema.index({ email: 1, resetPasswordOTP: 1, resetPasswordOTPExpires: 1 }, { sparse: true });

userschema.pre("save",async function(next){                                      
                                                                       
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,12);                         
    }
    next();
})

userschema.methods.isPasswordmatch= async function(password){
    return await bcrypt.compare(password,this.password); 
}

userschema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id, username: this.username, role: this.role, permissions: this.permissions },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h' }
    );
};

userschema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id, username: this.username, role: this.role, permissions: this.permissions },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '10d' }
    );
};

const User = mongoose.model("User", userschema);

export default User;

