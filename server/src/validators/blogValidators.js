import Joi from 'joi';
import { CATEGORIES, PLACEMENT_TYPES, DIFFICULTY, RESULTS, BLOG_STATUS, TRUST_LEVELS } from '../config/constants.js';

const placement = Joi.object({
  companyName: Joi.string().allow(''),
  role: Joi.string().allow(''),
  placementType: Joi.string().valid(...PLACEMENT_TYPES),
  year: Joi.number().integer().min(2000).max(2100),
  department: Joi.string().allow(''),
  graduationYear: Joi.number().integer().min(2000).max(2100),
  eligibility: Joi.string().allow(''),
  ctc: Joi.string().allow(''),
  rounds: Joi.array().items(Joi.object({ name: Joi.string().allow(''), description: Joi.string().allow('') })),
  difficulty: Joi.string().valid(...DIFFICULTY),
  skills: Joi.array().items(Joi.string()),
  technologies: Joi.array().items(Joi.string()),
  preparationDuration: Joi.string().allow(''),
  result: Joi.string().valid(...RESULTS),
  advice: Joi.string().allow(''),
  fieldVisibility: Joi.object({ ctc: Joi.boolean() }),
});

export const createBlogSchema = {
  body: Joi.object({
    title: Joi.string().min(4).max(200).required(),
    content: Joi.string().min(10).required(),
    coverImage: Joi.string().uri().allow(''),
    type: Joi.string().valid('general', 'placement').default('general'),
    status: Joi.string().valid(BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED).default(BLOG_STATUS.DRAFT),
    categories: Joi.array().items(Joi.string().valid(...CATEGORIES)),
    tags: Joi.array().items(Joi.string().max(40)),
    isAnonymous: Joi.boolean(),
    placement,
  }),
};

export const updateBlogSchema = {
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({
    title: Joi.string().min(4).max(200),
    content: Joi.string().min(10),
    coverImage: Joi.string().uri().allow(''),
    status: Joi.string().valid(...Object.values(BLOG_STATUS)),
    categories: Joi.array().items(Joi.string().valid(...CATEGORIES)),
    tags: Joi.array().items(Joi.string().max(40)),
    isAnonymous: Joi.boolean(),
    placement,
  }).min(1),
};

export const verifySchema = {
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({ level: Joi.string().valid(...Object.values(TRUST_LEVELS)).required() }),
};

export const idParam = { params: Joi.object({ id: Joi.string().hex().length(24).required() }) };
