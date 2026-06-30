import { requireAuth } from '../middleware/auth';
import { updateProfile, addBankAccount, getUserStats, getBankAccounts } from '../controllers/user/user.controller'
import { Router } from 'express';

const router = Router();

router.use(requireAuth);
router.get('/stats', getUserStats);
router.get('/banks', getBankAccounts);

router.put('/profile', updateProfile);
router.post('/bank', addBankAccount);

export default router