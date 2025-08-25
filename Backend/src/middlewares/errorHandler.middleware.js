function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
}

module.exports = errorHandler;