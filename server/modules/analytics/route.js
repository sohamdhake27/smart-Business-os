const express = require('express');
const controller = require('./controller');
const { protect } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { chartDataSchema, categoryBreakdownSchema, monthlyReportSchema } = require('./validation');

const router = express.Router();

router.use(protect);
router.get('/chart-data', validate(chartDataSchema), controller.getChartData);
router.get('/category-breakdown', validate(categoryBreakdownSchema), controller.getCategoryBreakdown);
router.get('/monthly-report', validate(monthlyReportSchema), controller.getMonthlyReport);

module.exports = router;
