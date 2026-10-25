// server/controllers/assignmentController.js
// Assignment CRUD — MongoDB backed. Students see/edit only their own work.

import Assignment from '../models/assignment.js';
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.isValidObjectId(id);

export const listAssignments = async (req, res, next) => {
  try {
    const user = req.user;
    const filter =
      user.role === 'student' ? { userId: user.userId } : {};

    const items = await Assignment.find(filter)
      .sort({ dueDate: 1 })
      .lean();

    // Normalize id + studentId for frontend compatibility
    const result = items.map((a) => ({
      ...a,
      id: String(a._id),
      studentId: String(a.userId),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAssignment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (
      req.user.role === 'student' &&
      String(assignment.userId) !== String(req.user.userId)
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...assignment,
      id: String(assignment._id),
      studentId: String(assignment.userId),
    });
  } catch (err) {
    next(err);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      description,
      studentId,
      dueDate,
      course,
      grade,
      weight,
    } = req.body;

    const currentUserId = req.user.userId;

    // Students can only create for themselves; teachers/admins may specify studentId
    let ownerId = currentUserId;
    if (req.user.role !== 'student') {
      if (studentId) {
        if (!isValidId(studentId)) {
          return res.status(400).json({ error: 'Invalid student ID' });
        }
        ownerId = studentId;
      }
    }

    const gradeVal =
      grade === '' || grade === undefined || grade === null
        ? null
        : Number(grade);
    const weightVal =
      weight === '' || weight === undefined || weight === null
        ? 0
        : Number(weight);

    const doc = await Assignment.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      userId: ownerId,
      dueDate: new Date(dueDate),
      course: course ? String(course).trim() : 'General',
      grade: gradeVal,
      weight: weightVal,
      createdBy: currentUserId,
      status:
        gradeVal !== null && gradeVal !== undefined ? 'completed' : 'assigned',
    });

    const json = doc.toJSON();
    res.status(201).json(json);
  } catch (err) {
    next(err);
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Students may only update their own (and only limited fields)
    if (
      req.user.role === 'student' &&
      String(assignment.userId) !== String(req.user.userId)
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, dueDate, status, grade, weight, course } =
      req.body;

    if (title !== undefined) assignment.title = String(title).trim();
    if (description !== undefined) assignment.description = String(description).trim();
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
    if (status !== undefined) assignment.status = status;
    if (course !== undefined) assignment.course = String(course).trim();
    if (grade !== undefined) {
      assignment.grade =
        grade === null || grade === '' ? null : Number(grade);
    }
    if (weight !== undefined) {
      assignment.weight =
        weight === null || weight === '' ? 0 : Number(weight);
    }

    await assignment.save();
    res.json(assignment.toJSON());
  } catch (err) {
    next(err);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (
      req.user.role === 'student' &&
      String(assignment.userId) !== String(req.user.userId)
    ) {
      return res.status(403).json({
        error: 'You can only delete your own assignments',
      });
    }

    await assignment.deleteOne();
    res.json({ deleted: { id: String(assignment._id) } });
  } catch (err) {
    next(err);
  }
};
