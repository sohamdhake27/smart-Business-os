const asyncHandler = require('../../shared/middleware/asyncHandler');
const service = require('./service');

const getChartData = asyncHandler(async (req, res) => {
  const data = await service.getChartData(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const result = await service.getCategoryBreakdown(req.user._id, req.query);
  res.status(200).json({ success: true, data: result.data, total: result.total });
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const data = await service.getMonthlyReport(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

module.exports = {
  getChartData,
  getCategoryBreakdown,
  getMonthlyReport
};
