import { requireAuth } from '../middleware/auth';
import { updateProfile, addBankAccount, getUserStats, getBankAccounts, updatePushToken, getAvailableBanks, verifyUserBvn, verifyKycWithPaystack } from '../controllers/user/user.controller'
import { Router } from 'express';

const router = Router();

router.use(requireAuth);
router.get('/stats', getUserStats);
router.get('/banks', getBankAccounts);

router.put('/profile', updateProfile);
router.post('/bank', addBankAccount);
router.patch('/push-token', updatePushToken);

router.get('/banks/available', getAvailableBanks);
router.post('/verify-bvn', verifyUserBvn)
router.post('/verify-kyc', requireAuth, verifyKycWithPaystack);

export default router