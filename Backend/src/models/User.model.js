import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret";

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
    password: {
    type: String,
    required: [true, 'Password is required']
  },
  refreshToken: {
    type: String
  },
  gender:{
    type: String,
    enum: ['male','female','other']
  },
  bookingHistory:[
    {
        types:Schema.Types.ObjectId,
    }
  ],
    resetPasswordOTP: {
        type: String
    },
    resetPasswordOTPExpires: {
        type: Date
    }

},{
    timestamps: true,
})

userschema.pre("save",async function(next){                                      
                                                                       
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);                         
    }
    next();
})

userschema.methods.isPasswordmatch= async function(password){
    return await bcrypt.compare(password,this.password); 
}

userschema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id, username: this.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h' }
    );
};

userschema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id, username: this.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '10d' }
    );
};

const User = mongoose.model("User", userschema);

export default User;

