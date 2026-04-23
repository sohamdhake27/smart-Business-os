const Notification = require('./model');
const Transaction = require('../transactions/model');
const { emitToUser } = require('../../config/socket');

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const checkAndCreateNotifications = async (userId, transaction) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (transaction.type !== 'expense') return;

  if (transaction.amount >= 10000) {
    const notification = await Notification.create({
      user: userId,
      title: 'High Expense Alert',
      message: `A large expense of ${formatCurrency(transaction.amount)} was recorded under "${transaction.category}".`,
      type: 'warning',
      category: 'expense_alert',
      data: { transactionId: transaction._id, amount: transaction.amount }
    });
    emitToUser(userId, 'notification:new', notification);
  }

  const [monthlyExpenses, monthlySales] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: transaction.user, type: 'expense', date: { $gte: monthStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { user: transaction.user, type: 'sale', date: { $gte: monthStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalExpenses = monthlyExpenses[0]?.total || 0;
  const totalSales = monthlySales[0]?.total || 0;
  const profit = totalSales - totalExpenses;

  if (totalSales > 0 && profit < 0) {
    const existing = await Notification.findOne({
      user: userId,
      category: 'profit_alert',
      createdAt: { $gte: monthStart }
    });

    if (!existing) {
      const notification = await Notification.create({
        user: userId,
        title: 'Negative Profit Warning',
        message: `Your business is running at a loss this month by ${formatCurrency(Math.abs(profit))}.`,
        type: 'error',
        category: 'profit_alert',
        data: { profit, totalSales, totalExpenses }
      });
      emitToUser(userId, 'notification:new', notification);
    }
  }
};

const getNotifications = async (userId, { page = 1, limit = 20, unreadOnly }) => {
  const filter = { user: userId };
  if (unreadOnly === 'true') filter.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false })
  ]);

  return {
    notifications,
    total,
    unreadCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
};

const markAsRead = (userId, ids) =>
  Notification.updateMany({ _id: { $in: ids }, user: userId }, { isRead: true });

const markAllAsRead = (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

module.exports = {
  checkAndCreateNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead
};
