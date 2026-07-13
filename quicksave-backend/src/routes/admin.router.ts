import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { setupSuperAdmin, adminLogin, createSubAdmin } from '../controllers/auth/admin.controller';
import { getDashboardStats, getAllGroupsAdmin, getGroupAnalyticsAdmin, getAllMembersAdmin, getMemberDetailsAdmin, promoteMemberToAdmin, addMemberToGroupAdmin, updateGroupAdmin, getPlatformSettings, getAdminTickets, getAdminTransactions, getPayoutsAdmin, getAllTransactionsAdmin, exportTransactionsAdmin, getAllTicketsAdmin, createTicketAdmin, getTicketStatsAdmin, updatePlatformConfig, addWhitelistedIP, createMemberAdmin } from '../controllers/admin/admin.controller';
import { AppError } from '../utils/AppError';

const router = Router();

// Protect ALL admin routes with both JWT and Admin Role checks

router.post('/setup-super', setupSuperAdmin); // Postman only
router.post('/login', adminLogin);


router.use(requireAuth, requireAdmin);


router.get('/dashboard', getDashboardStats);
router.get('/groups', getAllGroupsAdmin);
router.get('/groups/:id', getGroupAnalyticsAdmin);
router.get('/members', getAllMembersAdmin);
router.get('/members/:id', getMemberDetailsAdmin);

router.post('/create-admin',  (req, res, next) => {
  if (req.user.systemRole !== 'SUPER_ADMIN') {
    return next(new AppError('Only Super Admins can add new admins', 403));
  }
  next();
}, createSubAdmin);

// Only SUPER_ADMIN can hit this
router.patch('/members/:id/promote', (req, res, next) => {
  if (req.user.systemRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Super Admin privileges required' });
  }
  next();
}, promoteMemberToAdmin);

router.post('/groups/:id/members', requireAuth, requireAdmin, addMemberToGroupAdmin);
router.patch('/groups/:id', requireAuth, requireAdmin, updateGroupAdmin);
router.get('/transactions', getAdminTransactions);
router.get('/support-tickets', getAdminTickets);
router.get('/settings', getPlatformSettings);
router.patch('/settings/config', requireAuth, requireAdmin, updatePlatformConfig);
router.post('/settings/whitelist', requireAuth, requireAdmin, addWhitelistedIP);
router.get('/payouts', requireAuth, requireAdmin, getPayoutsAdmin);
router.get('/transactions', requireAuth, requireAdmin, getAllTransactionsAdmin);
router.get('/transactions/export', requireAuth, requireAdmin, exportTransactionsAdmin);
router.get('/tickets', requireAuth, requireAdmin, getAllTicketsAdmin);
router.post('/tickets', requireAuth, requireAdmin, createTicketAdmin);
router.get('/tickets/stats', requireAuth, requireAdmin, getTicketStatsAdmin);
router.post('/members', requireAuth, requireAdmin, createMemberAdmin);



export default router;