const express = require('express');
const controller = require('./controller');
const { protect, requirePlan } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { chatQuerySchema } = require('./validation');

const router = express.Router();

router.use(protect);
router.get('/insights', controller.getInsights);
router.get('/prediction', controller.getPrediction);
router.get('/expense-spikes', requirePlan('pro', 'enterprise'), controller.getExpenseSpikes);
router.post('/chat', validate(chatQuerySchema), controller.chatQuery);

module.exports = router;
