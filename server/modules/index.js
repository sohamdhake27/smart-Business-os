const authRoutes = require('./auth/route');
const transactionRoutes = require('./transactions/route');
const analyticsRoutes = require('./analytics/route');
const aiRoutes = require('./ai/route');
const notificationRoutes = require('./notifications/route');

module.exports = {
  authRoutes,
  transactionRoutes,
  analyticsRoutes,
  aiRoutes,
  notificationRoutes
};
