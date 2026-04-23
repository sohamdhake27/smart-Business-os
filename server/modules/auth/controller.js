const asyncHandler = require('../../shared/middleware/asyncHandler');
const authService = require('./service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    ...result
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({
    success: true,
    message: `Welcome back, ${result.user.name}!`,
    ...result
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body, req.user);
  res.status(200).json({ success: true, message: 'Profile updated', user });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
