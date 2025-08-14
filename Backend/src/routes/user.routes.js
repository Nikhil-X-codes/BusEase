import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {registeruser,
  loginuser,
  logoutuser,
    changepassword,
    getuserProfile,
    updateProfile,
    refreshAccessToken,
    sendPasswordResetOTP,
    resetPasswordWithOTP} from '../Controllers/user.controller.js';

const userRouter = Router();

userRouter.post('/register', registeruser);
userRouter.post('/login', loginuser);
userRouter.post('/logout', verifyJWT, logoutuser);
userRouter.post('/changepassword', verifyJWT, changepassword);
userRouter.get('/username:/profile', verifyJWT, getuserProfile);
userRouter.put('/username:/updateprofile', verifyJWT, updateProfile);
userRouter.post('/refresh-token', refreshAccessToken);
userRouter.post('/send-password-reset-otp', sendPasswordResetOTP);
userRouter.post('/reset-password-with-otp', resetPasswordWithOTP);


export default userRouter;