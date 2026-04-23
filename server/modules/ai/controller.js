const asyncHandler = require('../../shared/middleware/asyncHandler');
const service = require('./service');

const getInsights = asyncHandler(async (req, res) => {
  const data = await service.generateInsights(req.user._id);
  res.status(200).json({ success: true, data });
});

const getPrediction = asyncHandler(async (req, res) => {
  const data = await service.predictNextMonthSales(req.user._id);
  res.status(200).json({ success: true, data });
});

const getExpenseSpikes = asyncHandler(async (req, res) => {
  const data = await service.detectExpenseSpikes(req.user._id);
  res.status(200).json({ success: true, data });
});

const chatQuery = asyncHandler(async (req, res) => {
  const data = await service.processChatQuery(req.user._id, req.body.query.trim());
  res.status(200).json({ success: true, data });
});

module.exports = {
  getInsights,
  getPrediction,
  getExpenseSpikes,
  chatQuery
};
