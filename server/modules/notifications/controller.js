const asyncHandler = require('../../shared/middleware/asyncHandler');
const service = require('./service');

const getNotifications = asyncHandler(async (req, res) => {
  const result = await service.getNotifications(req.user.id, req.query);
  res.status(200).json({ success: true, data: result.notifications, unreadCount: result.unreadCount, pagination: result.pagination });
});

const markAsRead = asyncHandler(async (req, res) => {
  await service.markAsRead(req.user.id, req.body.ids);
  res.status(200).json({ success: true, message: 'Marked as read' });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await service.markAllAsRead(req.user.id);
  res.status(200).json({ success: true, message: 'All marked as read' });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
