import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createGroupSchema, generateRotationSchema, getGroupSchema, groupParamsSchema, joinGroupSchema, updateStatusSchema } from '../modules/group/group.schema';
import { createGroup, joinGroup, getGroupDetails, getGroupMembers, generateRotation, getRotationSchedule, getActivityFeed, updateGroupStatus, makeContribution, triggerPayout,inviteMembers, getMyGroups, syncOfflineContributions } from '../controllers/group/group.controller';
import { searchUsers } from '../controllers/user/user.controller';


const router = Router();


router.use(requireAuth);

// POST /api/v1/groups
router.get('/', getMyGroups);
router.post('/', validate(createGroupSchema), createGroup);
router.post('/join', validate(joinGroupSchema), joinGroup);
router.get('/:id', validate(getGroupSchema), getGroupDetails)
router.get('/:groupId/members', getGroupMembers);

router.post('/:id/rotation/generate', validate(generateRotationSchema), generateRotation);
router.get('/:id/rotation', validate(getGroupSchema), getRotationSchedule);

router.get('/:id/activity', getActivityFeed);
router.patch('/:id/status', validate(updateStatusSchema), updateGroupStatus);

router.post('/:id/contributions', validate(groupParamsSchema), makeContribution);
router.post('/:id/payout/trigger', validate(groupParamsSchema), triggerPayout);

router.get('/users/search', searchUsers);
router.post('/:id/invites', inviteMembers);

// 👉 Add the new route!
router.post('/sync-contributions', syncOfflineContributions);

export default router;