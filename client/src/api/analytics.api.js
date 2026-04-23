import http from './http';

export const getChartData = (params) => http.get('/analytics/chart-data', { params });
export const getCategoryBreakdown = (params) => http.get('/analytics/category-breakdown', { params });
export const getMonthlyReport = (params) => http.get('/analytics/monthly-report', { params });
