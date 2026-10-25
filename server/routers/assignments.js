// server/routers/assignments.js
import express from 'express';
import {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  validate,
  createAssignmentSchema,
  updateAssignmentSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.post(
  '/',
  requireRole('student', 'teacher', 'admin'),
  validate(createAssignmentSchema),
  createAssignment
);
router.put(
  '/:id',
  requireRole('student', 'teacher', 'admin'),
  validate(updateAssignmentSchema),
  updateAssignment
);
router.delete(
  '/:id',
  requireRole('student', 'teacher', 'admin'),
  deleteAssignment
);

export default router;
