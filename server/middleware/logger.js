// server/middleware/logger.js
const logger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.url}` +
        (Object.keys(req.query || {}).length
          ? ` query=${JSON.stringify(req.query)}`
          : '')
    );
  }
  next();
};

export default logger;
