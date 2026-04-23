const User = require('./model');
const { HttpError } = require('../../shared/utils/httpError');
const { logger } = require('../../shared/config/logger');

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  businessName: user.businessName,
  businessType: user.businessType,
  currency: user.currency,
  theme: user.theme,
  subscription: user.subscription,
  notifications: user.notifications,
  lastLogin: user.lastLogin
});

const register = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) throw new HttpError(400, 'Email already registered');

  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase()
  });

  logger.info('User registered', { userId: user._id, role: user.role });

  return {
    token: user.generateToken(),
    user: toPublicUser(user)
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new HttpError(401, 'Invalid credentials');

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in', { userId: user._id, role: user.role });

  return {
    token: user.generateToken(),
    user: toPublicUser(user)
  };
};

const updateProfile = async (userId, payload, requester) => {
  const updates = { ...payload };
  if (requester.role !== 'admin') delete updates.role;

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  });

  return toPublicUser(user);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) throw new HttpError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  logger.info('User changed password', { userId });
};

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
  toPublicUser
};
