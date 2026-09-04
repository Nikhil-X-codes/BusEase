import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import {registeruser,
  loginuser,
  logoutuser,
    changepassword,
    getuserProfile,
    updateProfile,
    refreshAccessToken,
    sendPasswordResetOTP,
    resetPasswordWithOTP,
} from '../Controllers/user.controller.js';

const userRouter = Router();
const authLimit = rateLimit({ name: 'auth:ip', limit: 30, windowMs: 15 * 60 * 1000 });

userRouter.post('/register', authLimit, registeruser);
userRouter.post('/login', authLimit, loginuser);
userRouter.post('/logout', verifyJWT, logoutuser);
userRouter.post('/changepassword', verifyJWT, changepassword);
userRouter.get('/profile', verifyJWT, getuserProfile);
userRouter.put('/update', verifyJWT, updateProfile);
userRouter.post('/refresh-token', refreshAccessToken);
userRouter.post('/send-password-reset-otp', authLimit, sendPasswordResetOTP);
userRouter.post('/reset-password-with-otp', authLimit, resetPasswordWithOTP);


export default userRouter;