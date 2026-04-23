const Transaction = require('../transactions/model');

class AIService {
  async predictNextMonthSales(userId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const data = await Transaction.aggregate([
      { $match: { user: userId, type: 'sale', date: { $gte: sixMonthsAgo }, status: 'completed' } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    if (data.length < 2) {
      return {
        prediction: null,
        confidence: 'low',
        message: 'Not enough sales data for prediction yet'
      };
    }

    const n = data.length;
    const x = data.map((_, index) => index + 1);
    const y = data.map((item) => item.total);
    const sumX = x.reduce((acc, value) => acc + value, 0);
    const sumY = y.reduce((acc, value) => acc + value, 0);
    const sumXY = x.reduce((acc, value, index) => acc + value * y[index], 0);
    const sumX2 = x.reduce((acc, value) => acc + value * value, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const prediction = Math.max(0, slope * (n + 1) + intercept);
    const trend = slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable';

    return {
      prediction: Math.round(prediction),
      confidence: Math.abs(slope) > 500 ? 'high' : Math.abs(slope) > 100 ? 'medium' : 'low',
      trend,
      historicalData: data,
      message: `Predicted next month's sales: INR ${Math.round(prediction).toLocaleString('en-IN')}`
    };
  }

  async detectExpenseSpikes(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: threeMonthsAgo }, status: 'completed' } },
      { $group: { _id: { year: { $year: '$date' }, week: { $week: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    if (expenses.length < 3) return { spikes: [], message: 'Insufficient data' };

    const values = expenses.map((entry) => entry.total);
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / values.length);

    const spikes = expenses
      .filter((entry) => stdDev > 0 && Math.abs((entry.total - mean) / stdDev) > 1.5)
      .map((entry) => ({
        week: entry._id.week,
        year: entry._id.year,
        amount: entry.total,
        deviation: Number((((entry.total - mean) / mean) * 100).toFixed(1))
      }));

    return {
      spikes,
      averageWeeklyExpense: Math.round(mean),
      message: spikes.length ? `Detected ${spikes.length} unusual expense spike(s)` : 'No unusual spikes detected'
    };
  }

  async generateInsights(userId) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth, categoryData, prediction] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: thisMonthStart }, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: thisMonthStart }, status: 'completed' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 3 }
      ]),
      this.predictNextMonthSales(userId)
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

    const current = parse(thisMonth);
    const previous = parse(lastMonth);
    const insights = [];

    if (previous.sales > 0) {
      const salesChange = Number((((current.sales - previous.sales) / previous.sales) * 100).toFixed(1));
      if (salesChange > 10) {
        insights.push({ type: 'success', title: 'Sales Growing', message: `Sales increased by ${salesChange}% vs last month.`, priority: 'high', action: 'Double down on channels driving repeat sales.' });
      } else if (salesChange < -10) {
        insights.push({ type: 'warning', title: 'Sales Declining', message: `Sales dropped by ${Math.abs(salesChange)}% vs last month.`, priority: 'high', action: 'Review promotions and pricing for underperforming products.' });
      }
    }

    if (previous.expenses > 0) {
      const expenseChange = Number((((current.expenses - previous.expenses) / previous.expenses) * 100).toFixed(1));
      if (expenseChange > 20) {
        insights.push({ type: 'warning', title: 'Expense Alert', message: `Expenses rose ${expenseChange}% month over month.`, priority: 'high', action: 'Reduce marketing spend or audit vendor costs.' });
      }
    }

    if (categoryData[0]) {
      insights.push({
        type: 'info',
        title: 'Top Expense Category',
        message: `${categoryData[0]._id.replace(/_/g, ' ')} is the highest expense this month.`,
        priority: 'medium',
        action: 'Set a category budget alert for this bucket.'
      });
    }

    if (current.sales > 0) {
      const margin = Number(((current.profit / current.sales) * 100).toFixed(1));
      if (margin < 20) {
        insights.push({ type: 'warning', title: 'Low Margin', message: `Current profit margin is ${margin}%.`, priority: 'medium', action: 'Increase pricing or trim non-essential spend.' });
      }
    }

    if (prediction.prediction) {
      insights.push({
        type: prediction.trend === 'upward' ? 'success' : 'info',
        title: 'Trend Prediction',
        message: prediction.message,
        priority: 'medium',
        action: prediction.trend === 'upward' ? 'Prepare inventory and staffing for growth.' : 'Review pipeline quality and recovery campaigns.'
      });
    }

    const smartAlerts = insights
      .filter((item) => item.priority === 'high' || item.priority === 'critical')
      .map((item) => item.message);

    return {
      insights,
      smartAlerts,
      trendPrediction: prediction,
      suggestions: insights.map((item) => item.action).filter(Boolean),
      summary: current
    };
  }

  async processChatQuery(userId, query) {
    const lowerQuery = query.toLowerCase();
    const now = new Date();
    let response = '';
    let data = null;
    let intent = 'unknown';

    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      intent = 'sales_query';
      const startDate = lowerQuery.includes('week')
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const label = lowerQuery.includes('week') ? 'this week' : 'this month';

      const result = await Transaction.aggregate([
        { $match: { user: userId, type: 'sale', date: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      const total = result[0]?.total || 0;
      const count = result[0]?.count || 0;
      response = `Total sales for ${label}: INR ${total.toLocaleString('en-IN')} across ${count} transactions.`;
      data = { total, count };
    } else if (lowerQuery.includes('expense') || lowerQuery.includes('spending')) {
      intent = 'expense_query';
      const breakdown = await Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }, status: 'completed' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]);
      response = breakdown.length
        ? `Top expense this month is ${breakdown[0]._id.replace(/_/g, ' ')} at INR ${breakdown[0].total.toLocaleString('en-IN')}.`
        : 'No expense data available this month.';
      data = breakdown;
    } else if (lowerQuery.includes('profit') || lowerQuery.includes('margin')) {
      intent = 'profit_query';
      const summary = await this.generateInsights(userId);
      response = `Current month profit is INR ${summary.summary.profit.toLocaleString('en-IN')} with ${summary.summary.sales ? ((summary.summary.profit / summary.summary.sales) * 100).toFixed(1) : 0}% margin.`;
      data = summary.summary;
    } else if (lowerQuery.includes('suggest') || lowerQuery.includes('recommend')) {
      intent = 'advice_query';
      const insights = await this.generateInsights(userId);
      response = insights.suggestions.length
        ? insights.suggestions.map((item, index) => `${index + 1}. ${item}`).join('\n')
        : 'Add more transaction data to unlock smart recommendations.';
      data = insights.suggestions;
    } else {
      response = 'Try asking about sales, expenses, profit, or suggestions for improving the business.';
    }

    return { intent, response, data, timestamp: new Date() };
  }
}

module.exports = new AIService();
