import { ApiError } from '../utils/ApiError.js';

/* Joi validation middleware. Pass { body, query, params } schemas. */
export const validate = (schemas) => (req, res, next) => {
  for (const key of ['body', 'query', 'params']) {
    if (!schemas[key]) continue;
    const { error, value } = schemas[key].validate(req[key], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = Object.fromEntries(
        error.details.map((d) => [d.path.join('.'), d.message.replace(/"/g, '')])
      );
      return next(new ApiError(400, 'Validation failed', details));
    }
    req[key] = value;
  }
  next();
};

export default validate;
