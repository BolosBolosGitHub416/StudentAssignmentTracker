// server/controllers/assignmentController.js
import { assignments } from '../models/assignments.js'; // Import the in-memory assignment store
// (replace with DB in production)
// Assignment controller functions
// List all assignments (students see only their own, teachers/admins see all)
export const listAssignments = (req, res) => {
  const user = req.user;

  if (user.role === 'student') {
    const studentAssignments = assignments.filter((assignment) => assignment.studentId === user.userId);
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

  if (req.user.role === 'student' && assignment.studentId !== req.user.userId) {
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

  const { title, description, dueDate, status } = req.body;

  if (title !== undefined) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (dueDate !== undefined) assignment.dueDate = dueDate;
  if (status !== undefined) assignment.status = status;

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

  const [deleted] = assignments.splice(index, 1);

  res.json({ deleted });
};
