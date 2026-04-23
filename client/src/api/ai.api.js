import http from './http';

export const getInsights = () => http.get('/ai/insights');
export const getPrediction = () => http.get('/ai/prediction');
export const sendChat = (query) => http.post('/ai/chat', { query });
