// server/middleware/validate.js
// Used for registration, login, assignment create/update, etc

const isEmail = (v) => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v.trim());
const isNonEmptyString = (v, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
const isDate = (v) => {
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
};
const isNumberInRange = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
};

/**
 * Factory that returns Express middleware.
 * schema: { field: (value, body) => errorMessage | null }
 */
export function validate(schema) {
  return (req, res, next) => {
    const errors = {};
    for (const [field, checker] of Object.entries(schema)) {
      const msg = checker(req.body[field], req.body);
      if (msg) errors[field] = msg;
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}

export const registerSchema = {
  email: (v) => (!isEmail(v) ? 'Valid email is required' : null),
  password: (v) =>
    typeof v !== 'string' || v.length < 8
      ? 'Password must be at least 8 characters'
      : null,
  firstName: (v) => (!isNonEmptyString(v, 50) ? 'First name is required (max 50)' : null),
  lastName: (v) => (!isNonEmptyString(v, 50) ? 'Last name is required (max 50)' : null),
  role: (v) => {
    if (v === undefined || v === null || v === '') return null;
    const allowed = ['student', 'teacher', 'admin', 'advisor'];
    return allowed.includes(v) ? null : `Role must be one of: ${allowed.join(', ')}`;
  },
};

export const loginSchema = {
  email: (v) => (!isEmail(v) ? 'Valid email is required' : null),
  password: (v) => (!isNonEmptyString(v, 200) ? 'Password is required' : null),
};

export const createAssignmentSchema = {
  title: (v) => (!isNonEmptyString(v, 200) ? 'Title is required (max 200)' : null),
  dueDate: (v) => (!isDate(v) ? 'Valid due date is required' : null),
  weight: (v) => {
    if (v === undefined || v === null || v === '') return null;
    return isNumberInRange(v, 0, 100) ? null : 'Weight must be between 0 and 100';
  },
  grade: (v) => {
    if (v === undefined || v === null || v === '') return null;
    return isNumberInRange(v, 0, 100) ? null : 'Grade must be between 0 and 100';
  },
  course: (v) => {
    if (v === undefined || v === null || v === '') return null;
    return isNonEmptyString(String(v), 80) ? null : 'Course name is too long';
  },
};

export const updateAssignmentSchema = {
  title: (v) => {
    if (v === undefined) return null;
    return isNonEmptyString(v, 200) ? null : 'Title must be a non-empty string (max 200)';
  },
  dueDate: (v) => {
    if (v === undefined) return null;
    return isDate(v) ? null : 'Valid due date is required';
  },
  status: (v) => {
    if (v === undefined) return null;
    const allowed = ['assigned', 'in_progress', 'completed', 'overdue'];
    return allowed.includes(v) ? null : `Status must be one of: ${allowed.join(', ')}`;
  },
  weight: (v) => {
    if (v === undefined || v === null || v === '') return null;
    return isNumberInRange(v, 0, 100) ? null : 'Weight must be between 0 and 100';
  },
  grade: (v) => {
    if (v === undefined || v === null || v === '') return null;
    return isNumberInRange(v, 0, 100) ? null : 'Grade must be between 0 and 100';
  },
};

export default validate;
