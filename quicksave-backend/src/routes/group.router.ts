import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createGroupSchema, generateRotationSchema, getGroupSchema, joinGroupSchema } from '../modules/group/group.schema';
import { createGroup, joinGroup, getGroupDetails, getGroupMembers, generateRotation, getRotationSchedule } from '../controllers/group/group.controller';


const router = Router();

// 👉 Every route in the group module MUST be protected by requireAuth!
router.use(requireAuth);

// POST /api/v1/groups
router.post('/', validate(createGroupSchema), createGroup);
router.post('/join', validate(joinGroupSchema), joinGroup);
router.get('/:id', validate(getGroupSchema), getGroupDetails)
router.get('/:groupId/members', getGroupMembers);

router.post('/:id/rotation/generate', validate(generateRotationSchema), generateRotation);
router.get('/:id/rotation', validate(getGroupSchema), getRotationSchedule);

export default router;