import http from './http';

export const loginRequest = (payload) => http.post('/auth/login', payload);
export const registerRequest = (payload) => http.post('/auth/register', payload);
export const getCurrentUserRequest = () => http.get('/auth/me');
export const updateProfileRequest = (payload) => http.put('/auth/profile', payload);
