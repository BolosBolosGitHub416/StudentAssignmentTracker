// server/middleware/errorHandler.js
export const notFound = (req, res) => {
  res.status(404).json({ error: 'Resource not found' });
};

export const errorHandler = (err, req, res, _next) => {
  console.error(err);

  // Mongoose validation / cast errors → 400
  if (err.name === 'ValidationError') {
    const details = {};
    for (const [key, val] of Object.entries(err.errors || {})) {
      details[key] = val.message;
    }
    return res.status(400).json({ error: 'Validation failed', details });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // Duplicate key (unique index)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};
