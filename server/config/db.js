const mongoose = require('mongoose');
const { env } = require('../shared/config/env');
const { logger } = require('../shared/config/logger');

const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error('MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI in server/.env.');
  }

  const conn = await mongoose.connect(env.mongoUri);
  logger.info('MongoDB connected', { host: conn.connection.host });
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', { message: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  return conn;
};

module.exports = connectDB;
