function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ==> ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const endTimestamp = new Date().toISOString();
    const log = `[${endTimestamp}] <== ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`;
    console.log(log);
  });

  next();
}

module.exports = requestLogger;