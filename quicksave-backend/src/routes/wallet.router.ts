import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyTransactions, getMyWallet, fundWallet, withdrawFunds, getTransactionDetails } from '../controllers/wallet/wallet.controller';
import { validate } from '../middleware/validate';
import { fundWalletSchema, withdrawSchema } from '../modules/wallet/wallet.schema';
import { requireKycTier1 } from '../middleware/requireKycTier1';
const router = Router();


router.use(requireAuth);

router.get('/', getMyWallet);
router.get('/transactions', getMyTransactions);
router.get('/transactions/:id', getTransactionDetails);

router.post('/fund', requireKycTier1, validate(fundWalletSchema), fundWallet);
router.post('/withdraw', requireKycTier1, validate(withdrawSchema), withdrawFunds);

export default router;