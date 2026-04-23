const currencySymbolMap = {
  INR: 'Rs ',
  USD: '$',
  EUR: 'EUR '
};

export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  const prefix = currencySymbolMap[currency] || `${currency} `;
  if (num >= 10000000) return `${prefix}${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${prefix}${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${prefix}${(num / 1000).toFixed(1)}K`;
  return `${prefix}${num.toLocaleString('en-IN')}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const getPercentageChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
};
