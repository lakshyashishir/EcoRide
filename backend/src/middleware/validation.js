const Joi = require('joi');

const qrDataSchema = Joi.object({
  qrData: Joi.string()
    .required()
    .min(10)
    .messages({
      'string.min': 'QR data is too short',
      'any.required': 'QR data is required'
    })
});

const stationSchema = Joi.object({
  fromStation: Joi.string().required().messages({
    'any.required': 'From station is required'
  }),
  toStation: Joi.string().required().messages({
    'any.required': 'To station is required'
  }),
  distance: Joi.number().positive().optional()
});

const hederaTransactionSchema = Joi.object({
  accountId: Joi.string()
    .pattern(/^0\.0\.\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'Account ID must be in format 0.0.xxxx',
      'any.required': 'Account ID is required'
    }),
  amount: Joi.number()
    .positive()
    .integer()
    .max(1000000)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'number.integer': 'Amount must be an integer',
      'number.max': 'Amount cannot exceed 1,000,000 tokens',
      'any.required': 'Amount is required'
    }),
  journeyId: Joi.string().required().messages({
    'any.required': 'Journey ID is required'
  })
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(validationError);
    }

    next();
  };
};

const validateQRData = validate(qrDataSchema);
const validateStationData = validate(stationSchema);
const validateHederaTransaction = validate(hederaTransactionSchema);

module.exports = {
  validate,
  validateQRData,
  validateStationData,
  validateHederaTransaction,
  schemas: {
    qrDataSchema,
    stationSchema,
    hederaTransactionSchema
  }
};