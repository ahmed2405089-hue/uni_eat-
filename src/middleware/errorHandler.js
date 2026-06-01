const ApiError = require('../utils/ApiError');

const handleCastErrorDB = (err) => new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new ApiError(`Duplicate ${field}: "${value}" already exists.`, 409);
};
const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new ApiError(`Validation error: ${messages.join('. ')}`, 400);
};
const handleJWTError = () => new ApiError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new ApiError('Your session has expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again later.' });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const isApiRequest = req.xhr || req.path.startsWith('/api/') || req.headers.accept?.includes('application/json');

  if (process.env.NODE_ENV === 'development') {
    if (isApiRequest) return sendErrorDev(err, res);
    console.error(err);
    return res.status(err.statusCode).render('error', {
      layout: 'layouts/main',
      title: 'Error',
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
    });
  }

  let error = { ...err, message: err.message };
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (isApiRequest) return sendErrorProd(error, res);

  res.status(error.statusCode || 500).render('error', {
    layout: 'layouts/main',
    title: 'Error',
    statusCode: error.statusCode || 500,
    message: error.isOperational ? error.message : 'Something went wrong.',
    stack: null,
  });
};
