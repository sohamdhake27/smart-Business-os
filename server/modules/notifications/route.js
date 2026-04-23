const express = require('express');
const controller = require('./controller');
const { protect } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { notificationsQuerySchema, markAsReadSchema } = require('./validation');

const router = express.Router();

router.use(protect);
router.get('/', validate(notificationsQuerySchema), controller.getNotifications);
router.put('/mark-read', validate(markAsReadSchema), controller.markAsRead);
router.put('/read-all', controller.markAllAsRead);

module.exports = router;
