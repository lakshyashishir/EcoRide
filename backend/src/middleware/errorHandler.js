const errorHandler = (err, req, res, next) => {
  if (err.name === 'HederaError') {
    return res.status(400).json({
      success: false,
      error: 'Blockchain transaction failed',
      message: err.message,
      code: 'HEDERA_ERROR'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'QRParseError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid QR code format',
      message: err.message,
      code: 'QR_PARSE_ERROR'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;