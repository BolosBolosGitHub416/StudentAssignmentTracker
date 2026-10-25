// server/controllers/analyticsController.js
// Field mapping: DB uses userId analytics helpers accept either

import { calculateCourseGPA, calculateCumulativeGPA } from '../utils/analytics.js';
import {
  buildCourseSnapshot,
  buildDashboard,
  buildPriorityList,
  groupByCourse,
} from '../utils/dashboard.js';
import Assignment from '../models/assignment.js';

const load = async (userId, course) => {
  const filter = { userId };
  if (course) filter.course = course;

  const docs = await Assignment.find(filter).lean();
  // Normalize shape expected by analytics helpers
  return docs.map((a) => ({
    ...a,
    id: String(a._id),
    studentId: String(a.userId),
    _id: a._id,
  }));
};

// GET /api/analytics/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    res.json(buildDashboard(await load(req.user.userId)));
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/gpa?course=CPAN212
export const getGPA = async (req, res, next) => {
  try {
    const list = await load(req.user.userId, req.query.course);
    res.json({ course: req.query.course || 'all', ...calculateCourseGPA(list) });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/gpa/cumulative
export const getCumulativeGPA = async (req, res, next) => {
  try {
    const grouped = groupByCourse(await load(req.user.userId));
    const courses = Object.entries(grouped).map(([courseName, assignments]) => ({
      courseName,
      assignments,
    }));
    res.json({ cumulativeGPA: calculateCumulativeGPA(courses) });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/predict?course=CPAN212
export const getPrediction = async (req, res, next) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ error: 'course query parameter is required' });
    }
    const list = await load(req.user.userId, course);
    if (list.length === 0) {
      return res.status(404).json({ error: 'No assignments found for this course' });
    }
    res.json({ course, ...buildCourseSnapshot(course, list).prediction });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/priority
export const getPriorityList = async (req, res, next) => {
  try {
    res.json(buildPriorityList(await load(req.user.userId), 20));
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/risk?course=CPAN212
export const getRiskAssessment = async (req, res, next) => {
  try {
    const { course } = req.query;
    const list = await load(req.user.userId, course);
    if (list.length === 0) {
      return res.json({
        riskLevel: 'NONE',
        alerts: [],
        recommendations: ['Add assignments to track your progress.'],
      });
    }
    res.json({
      course: course || 'all',
      ...buildCourseSnapshot(course || 'all', list).risk,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/trends?course=CPAN212
export const getPerformanceTrends = async (req, res, next) => {
  try {
    const { course } = req.query;
    const list = await load(req.user.userId, course);
    res.json({
      course: course || 'all',
      ...buildCourseSnapshot(course || 'all', list).trends,
    });
  } catch (err) {
    next(err);
  }
};
