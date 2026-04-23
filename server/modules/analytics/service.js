const Transaction = require('../transactions/model');

const getChartData = async (userId, { view = 'monthly', year }) => {
  const now = new Date();
  const targetYear = Number(year) || now.getFullYear();
  let matchStage;
  let groupStage;

  if (view === 'daily') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    matchStage = { user: userId, date: { $gte: thirtyDaysAgo }, status: 'completed' };
    groupStage = { _id: { type: '$type', day: { $dayOfMonth: '$date' }, month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } };
  } else if (view === 'weekly') {
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);
    matchStage = { user: userId, date: { $gte: twelveWeeksAgo }, status: 'completed' };
    groupStage = { _id: { type: '$type', week: { $week: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } };
  } else {
    matchStage = {
      user: userId,
      date: { $gte: new Date(targetYear, 0, 1), $lte: new Date(targetYear, 11, 31) },
      status: 'completed'
    };
    groupStage = { _id: { type: '$type', month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } };
  }

  const data = await Transaction.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const salesData = {};
  const expenseData = {};

  data.forEach((item) => {
    let label;
    if (view === 'daily') label = `${item._id.day}/${item._id.month}`;
    else if (view === 'weekly') label = `W${item._id.week}`;
    else label = monthNames[item._id.month - 1];

    if (item._id.type === 'sale') salesData[label] = (salesData[label] || 0) + item.total;
    else expenseData[label] = (expenseData[label] || 0) + item.total;
  });

  const labels = [...new Set([...Object.keys(salesData), ...Object.keys(expenseData)])];

  return {
    labels,
    sales: labels.map((label) => salesData[label] || 0),
    expenses: labels.map((label) => expenseData[label] || 0),
    profit: labels.map((label) => (salesData[label] || 0) - (expenseData[label] || 0))
  };
};

const getCategoryBreakdown = async (userId, { type = 'expense', period = 'month' }) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const data = await Transaction.aggregate([
    { $match: { user: userId, type, date: { $gte: startDate }, status: 'completed' } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);

  const total = data.reduce((sum, item) => sum + item.total, 0);
  return {
    data: data.map((item) => ({
      category: item._id,
      total: item.total,
      count: item.count,
      percentage: total > 0 ? Number(((item.total / total) * 100).toFixed(1)) : 0
    })),
    total
  };
};

const getMonthlyReport = async (userId, { year, month }) => {
  const now = new Date();
  const targetYear = Number(year) || now.getFullYear();
  const targetMonth = month !== undefined ? Number(month) : now.getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
  const prevStart = new Date(targetYear, targetMonth - 1, 1);
  const prevEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const [current, previous] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startDate, $lte: endDate }, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: prevStart, $lte: prevEnd }, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ])
  ]);

  const parse = (rows) => {
    const result = { sales: 0, expenses: 0 };
    rows.forEach((item) => {
      if (item._id === 'sale') result.sales = item.total;
      if (item._id === 'expense') result.expenses = item.total;
    });
    result.profit = result.sales - result.expenses;
    return result;
  };

  const currentData = parse(current);
  const previousData = parse(previous);
  const growth = (currentValue, previousValue) =>
    previousValue > 0 ? Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1)) : 0;

  return {
    period: { year: targetYear, month: targetMonth },
    current: currentData,
    previous: previousData,
    growth: {
      sales: growth(currentData.sales, previousData.sales),
      expenses: growth(currentData.expenses, previousData.expenses),
      profit: growth(currentData.profit, previousData.profit)
    }
  };
};

module.exports = {
  getChartData,
  getCategoryBreakdown,
  getMonthlyReport
};
