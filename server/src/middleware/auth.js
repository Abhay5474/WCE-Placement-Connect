import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/apiResponse.js';

/* Requires a valid access token; attaches req.user. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
  if (!token) throw ApiError.unauthorized('Authentication required');

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');

  req.user = user;
  next();
});

/* Attaches req.user if a token is present, but does not require it. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (user && user.isActive) req.user = user;
    } catch {
      /* ignore invalid optional token */
    }
  }
  next();
});

/* Role gate. Usage: requireRole(ROLES.ADMIN, ROLES.COORDINATOR) */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
  next();
};

/* Contributor gate. Anyone may READ placement content without an account, but
   ADDING an experience requires admin-granted access. Elevated roles are exempt. */
const ELEVATED = ['faculty', 'coordinator', 'admin'];
export const requireContributor = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.canContribute || ELEVATED.includes(req.user.role)) return next();
  return next(
    ApiError.forbidden('Contributor access is required to add experiences. Please request access from an admin.')
  );
};
