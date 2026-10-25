// server/controllers/assignmentController.js
import { assignments } from '../models/assignments.js'; // Import the in-memory assignment store
// (replace with DB in production)
// Assignment controller functions
// List all assignments (students see only their own, teachers/admins see all)
export const listAssignments = (req, res) => {
  const user = req.user;

  if (user.role === 'student') {
    const studentAssignments = assignments.filter(
      (assignment) => (assignment.userId || assignment.studentId) === user.userId
    );
    return res.json(studentAssignments);
  }

  res.json(assignments);
};
// Get a single assignment by ID
export const getAssignment = (req, res) => {
  const assignment = assignments.find((item) => item.id === req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (
    req.user.role === 'student' &&
    (assignment.userId || assignment.studentId) !== req.user.userId
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(assignment);
};
// Create a new assignment
export const createAssignment = (req, res) => {
  const { title, course, weight, description, dueDate, status, grade } = req.body;
  const requestedUserId = req.body.userId || req.body.studentId;
  const userId = req.user.role === 'student' ? req.user.userId : requestedUserId;
  const numericWeight = Number(weight);
  const numericGrade = grade === undefined || grade === null ? null : Number(grade);

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    typeof course !== 'string' ||
    !course.trim() ||
    typeof dueDate !== 'string' ||
    !dueDate ||
    !userId
  ) {
    return res.status(400).json({
      error: 'title, course, dueDate, and userId are required',
    });
  }
  if (
    weight === undefined ||
    weight === '' ||
    !Number.isFinite(numericWeight) ||
    numericWeight < 0 ||
    numericWeight > 100
  ) {
    return res.status(400).json({ error: 'weight must be a number between 0 and 100' });
  }
  if (
    grade !== undefined &&
    grade !== null &&
    (grade === '' || !Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 100)
  ) {
    return res.status(400).json({ error: 'grade must be a number between 0 and 100' });
  }
  if (status !== undefined && !['assigned', 'in progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status is not valid' });
  }

  const newAssignment = {
    id: `${Date.now()}`,
    title: title.trim(),
    course: course.trim(),
    weight: numericWeight,
    description: description || '',
    userId,
    studentId: userId,
    dueDate,
    createdBy: req.user.userId,
    status: status || 'assigned',
    grade: numericGrade,
  };

  assignments.push(newAssignment);
  res.status(201).json(newAssignment);
};
// Update an existing assignment
export const updateAssignment = (req, res) => {
  const assignment = assignments.find((item) => item.id === req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const { title, course, weight, description, dueDate, status, grade } = req.body;
  const numericWeight = weight === undefined ? undefined : Number(weight);
  const numericGrade = grade === undefined || grade === null ? null : Number(grade);
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (course !== undefined && (typeof course !== 'string' || !course.trim())) {
    return res.status(400).json({ error: 'course must be a non-empty string' });
  }
  if (
    weight !== undefined &&
    (weight === '' || !Number.isFinite(numericWeight) || numericWeight < 0 || numericWeight > 100)
  ) {
    return res.status(400).json({ error: 'weight must be a number between 0 and 100' });
  }
  if (
    grade !== undefined &&
    grade !== null &&
    (grade === '' || !Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 100)
  ) {
    return res.status(400).json({ error: 'grade must be a number between 0 and 100' });
  }
  if (status !== undefined && !['assigned', 'in progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status is not valid' });
  }

  if (title !== undefined) assignment.title = title.trim();
  if (course !== undefined) assignment.course = course.trim();
  if (numericWeight !== undefined) assignment.weight = numericWeight;
  if (description !== undefined) assignment.description = description;
  if (dueDate !== undefined) assignment.dueDate = dueDate;
  if (status !== undefined) assignment.status = status;
  if (grade !== undefined) assignment.grade = numericGrade;

  res.json(assignment);
};
// Delete an assignment
export const deleteAssignment = (req, res) => {
  const index = assignments.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const assignment = assignments[index];
  if (
    req.user.role === 'student' &&
    (assignment.userId || assignment.studentId) !== req.user.userId
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const [deleted] = assignments.splice(index, 1);
  res.json({ deleted });
};
