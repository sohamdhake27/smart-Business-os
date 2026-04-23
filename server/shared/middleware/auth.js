const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HttpError } = require('../utils/httpError');
const User = require('../../modules/auth/model');

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return next(new HttpError(401, 'Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return next(new HttpError(401, 'User not found'));
    if (!user.isActive) return next(new HttpError(401, 'Account deactivated'));

    req.user = user;
    return next();
  } catch (error) {
    return next(new HttpError(401, 'Token invalid or expired'));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, 'Forbidden'));
  }
  return next();
};

const requirePlan = (...plans) => (req, res, next) => {
  if (!req.user || !plans.includes(req.user.subscription.plan)) {
    return next(new HttpError(403, `This feature requires ${plans.join(' or ')} plan`));
  }
  return next();
};

module.exports = { protect, authorize, requirePlan };
