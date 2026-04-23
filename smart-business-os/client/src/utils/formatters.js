export const formatCurrency = (amount, currency = '₹') => {
  const num = Number(amount) || 0;
  if (num >= 10000000) return `${currency}${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${currency}${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${currency}${(num / 1000).toFixed(1)}K`;
  return `${currency}${num.toLocaleString('en-IN')}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const getPercentageChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
};
