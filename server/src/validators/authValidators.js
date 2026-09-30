import Joi from 'joi';

const password = Joi.string().min(8).max(128).required();
const email = Joi.string().email().lowercase().required();

export const registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(80).required(),
    email,
    password,
    department: Joi.string().max(80).allow(''),
    year: Joi.number().integer().min(1).max(5),
    graduationYear: Joi.number().integer().min(2000).max(2100),
  }),
};

export const loginSchema = { body: Joi.object({ email, password: Joi.string().required() }) };

export const verifyEmailSchema = {
  body: Joi.object({ email, token: Joi.string().required() }),
};

export const forgotSchema = { body: Joi.object({ email }) };

export const resetSchema = {
  body: Joi.object({ email, token: Joi.string().required(), password }),
};

export const changePasswordSchema = {
  body: Joi.object({ currentPassword: Joi.string().required(), newPassword: password }),
};
