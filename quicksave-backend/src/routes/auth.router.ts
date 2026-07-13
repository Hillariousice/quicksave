import { Router } from 'express';
import { validate } from '../middleware/validate';
import { forgotPasswordSchema, loginSchema, logoutSchema, refreshTokenSchema, registerSchema, resendOtpSchema, resetPasswordSchema, sendSmsCodeSchema, verifyOtpSchema } from '../modules/auth/auth.schema';
import { login, logout, refreshTokens, register, resendOtp, verifyOtp, changePassword,enable2FA, forgotPassword, resetPassword, sendSmsCode } from '../controllers/auth/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import { getActiveSessions, logoutAllDevices, revokeSession } from '../controllers/auth/session.controller';

const router = Router();

router.use(authLimiter); 
router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

router.post('/resend-otp', validate(resendOtpSchema),resendOtp);
router.post('/login', validate(loginSchema), login);

router.post('/refresh', validate(refreshTokenSchema), refreshTokens);
router.post('/logout', requireAuth, validate(logoutSchema), logout);

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'You have access to protected data!',
    data: req.user // Returns the user from the database
  });
});

router.put('/change-password', requireAuth, changePassword);
router.post('/2fa/enable', requireAuth, enable2FA);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/send-sms-code', validate(sendSmsCodeSchema), sendSmsCode);
router.get('/sessions', requireAuth, getActiveSessions);
router.delete('/sessions/all', requireAuth, logoutAllDevices);
router.delete('/sessions/:sessionId', requireAuth, revokeSession);
export default router;