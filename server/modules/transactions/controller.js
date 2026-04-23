const asyncHandler = require('../../shared/middleware/asyncHandler');
const service = require('./service');

const getTransactions = asyncHandler(async (req, res) => {
  const result = await service.getTransactions(req.user.id, req.query);
  res.status(200).json({ success: true, data: result.transactions, pagination: result.pagination });
});

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await service.createTransaction(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Transaction created', data: transaction });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await service.getTransaction(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: transaction });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await service.updateTransaction(req.user.id, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Transaction updated', data: transaction });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await service.deleteTransaction(req.user.id, req.params.id);
  res.status(200).json({ success: true, message: 'Transaction deleted' });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await service.getSummary(req.user._id, req.query.period);
  res.status(200).json({ success: true, data: summary });
});

module.exports = {
  getTransactions,
  createTransaction,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
};
