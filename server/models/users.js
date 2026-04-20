// server/models/users.js
// In-memory user store (replace with DB in production)
// Pre-hash the admin password for the default admin user
import bcrypt from 'bcryptjs';  // For hashing passwords

// In-memory user store (replace with DB in production)
// Pre-hash the admin password for the default admin user
const hashedAdminPassword = bcrypt.hashSync('AdminPass123!', 10);
// Sample users (in a real application, this would be stored in a database)
export const users = [
  {
    _id: '1',
    email: 'admin@tracker.local',
    password: hashedAdminPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
];
