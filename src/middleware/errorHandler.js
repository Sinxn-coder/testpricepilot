function notFoundHandler(req, res) {
  return res.status(404).json({
    error: "Route not found"
  });
}

function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    error: statusCode === 500 ? "Internal server error" : err.message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
