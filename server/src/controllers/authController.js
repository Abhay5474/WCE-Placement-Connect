import * as authService from '../services/authService.js';
import { ok, created, asyncHandler } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

const setRefreshCookie = (res, token) => res.cookie('refreshToken', token, refreshCookieOptions);

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  if (result.refreshToken) setRefreshCookie(res, result.refreshToken);
  created(res, result, 'Registration successful');
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body);
  ok(res, result, 'Email verified');
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);
  ok(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refresh({ refreshToken });
  setRefreshCookie(res, result.refreshToken);
  ok(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logout({ userId: req.user._id, refreshToken });
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => ok(res, { user: req.user.toPublicJSON() }));

export const forgotPassword = asyncHandler(async (req, res) =>
  ok(res, await authService.forgotPassword(req.body))
);

export const resetPassword = asyncHandler(async (req, res) =>
  ok(res, await authService.resetPassword(req.body))
);

export const changePassword = asyncHandler(async (req, res) =>
  ok(res, await authService.changePassword({ userId: req.user._id, ...req.body }))
);
