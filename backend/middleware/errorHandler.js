export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ message: "Email is already registered" });
  const status = error.status || (error.name === "ValidationError" ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? "Internal server error" : error.message });
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
