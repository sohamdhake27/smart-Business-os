process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '1d';
process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const { app } = require('../app');

describe('server app', () => {
  test('GET /api/health returns ok payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/login validates request body', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
