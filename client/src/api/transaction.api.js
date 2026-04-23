import http from './http';

export const getTransactions = (params) => http.get('/transactions', { params });
export const getTransactionSummary = (period) => http.get('/transactions/summary', { params: { period } });
export const createTransaction = (payload) => http.post('/transactions', payload);
export const updateTransaction = (id, payload) => http.put(`/transactions/${id}`, payload);
export const deleteTransaction = (id) => http.delete(`/transactions/${id}`);
