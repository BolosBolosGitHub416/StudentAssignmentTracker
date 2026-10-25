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
  const {
    title,
    description,
    studentId,
    dueDate,
    course,
    grade,
    weight
  } = req.body;

  const currentUserId = req.user.userId;

  // Students can only create assignments for themselves
  const ownerId =
    req.user.role === "student"
      ? currentUserId
      : studentId;

  if (!title || !ownerId || !dueDate) {
    return res.status(400).json({
      error: "Title, student ID, and due date are required"
    });
  }

  const newAssignment = {
    id: `${Date.now()}`,
    title,
    description: description || "",
    studentId: ownerId,
    dueDate,
    course: course || "General",
    grade: grade ?? null,
    weight: weight ?? 0,
    createdBy: currentUserId,
status: grade !== null && grade !== undefined ? "completed" : "assigned"  };

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
  const index = assignments.findIndex(
    (item) => item.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Assignment not found"
    });
  }

  const assignment = assignments[index];

  // Students can only delete their own assignments
  if (
    req.user.role === "student" &&
    String(assignment.studentId) !== String(req.user.userId)
  ) {
    return res.status(403).json({
      error: "You can only delete your own assignments"
    });
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
