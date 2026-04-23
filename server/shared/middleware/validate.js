const { ZodError } = require('zod');
const { HttpError } = require('../utils/httpError');

const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    req.body = result.body || req.body;
    req.query = result.query || req.query;
    req.params = result.params || req.params;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new HttpError(400, 'Validation failed', error.flatten()));
    }
    return next(error);
  }
};

module.exports = { validate };
