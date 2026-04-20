// server/models/assignments.js
// In-memory data store for assignments
// In a production application, this would be replaced with a database
export const assignments = [ // Sample assignment for testing
  {
    id: '1',
    title: 'Build assignment tracker demo',
    description: 'Submit the first version of the student assignment tracker.',
    studentId: 'student-1',
    dueDate: '2026-05-01',
    createdBy: '1',
    status: 'assigned',
  },
];
