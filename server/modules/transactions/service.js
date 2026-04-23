const Transaction = require('./model');
const { emitDashboardUpdate } = require('../../config/socket');
const notificationService = require('../notifications/service');
const { HttpError } = require('../../shared/utils/httpError');

const getTransactions = async (userId, query) => {
  const {
    type,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    search,
    sortBy = 'date',
    sortOrder = 'desc'
  } = query;

  const filter = { user: userId };
  if (type && type !== 'all') filter.type = type;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Transaction.countDocuments(filter)
  ]);

  return {
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
};

const createTransaction = async (userId, payload) => {
  const transaction = await Transaction.create({ ...payload, user: userId });
  await notificationService.checkAndCreateNotifications(userId, transaction);

  emitDashboardUpdate(userId, {
    type: 'new_transaction',
    transaction,
    message: `New ${transaction.type} recorded`
  });

  return transaction;
};

const getTransaction = async (userId, transactionId) => {
  const transaction = await Transaction.findOne({ _id: transactionId, user: userId });
  if (!transaction) throw new HttpError(404, 'Transaction not found');
  return transaction;
};

const updateTransaction = async (userId, transactionId, payload) => {
  await getTransaction(userId, transactionId);
  const transaction = await Transaction.findByIdAndUpdate(transactionId, payload, {
    new: true,
    runValidators: true
  });

  emitDashboardUpdate(userId, { type: 'updated_transaction', transaction });
  return transaction;
};

const deleteTransaction = async (userId, transactionId) => {
  const transaction = await getTransaction(userId, transactionId);
  await transaction.deleteOne();
  emitDashboardUpdate(userId, { type: 'deleted_transaction', transactionId });
};

const getSummary = async (userId, period = 'month') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const summary = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: startDate }, status: 'completed' } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } }
  ]);

  const result = {
    totalSales: 0,
    salesCount: 0,
    totalExpenses: 0,
    expenseCount: 0,
    profit: 0,
    profitMargin: 0,
    period,
    startDate
  };

  summary.forEach((item) => {
    if (item._id === 'sale') {
      result.totalSales = item.total;
      result.salesCount = item.count;
    }
    if (item._id === 'expense') {
      result.totalExpenses = item.total;
      result.expenseCount = item.count;
    }
  });

  result.profit = result.totalSales - result.totalExpenses;
  result.profitMargin = result.totalSales > 0 ? Number(((result.profit / result.totalSales) * 100).toFixed(2)) : 0;

  return result;
};

module.exports = {
  getTransactions,
  createTransaction,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
};
