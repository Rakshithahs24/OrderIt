const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  const env = (process.env.NODE_ENV || "development").toLowerCase();

  let error = { ...err };
  error.message = err.message;

  if (err.name === "CastError") {
    error = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
  }
  if (err.name === "ValidationError") {
    error = new ErrorHandler(
      Object.values(err.errors).map((v) => v.message).join(", "),
      400
    );
  }
  if (err.code === 11000) {
    error = new ErrorHandler(`Duplicate ${Object.keys(err.keyValue)} entered`, 400);
  }
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler("JSON Web Token is