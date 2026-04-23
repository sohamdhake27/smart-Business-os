const mongoose = require('mongoose');
const { logger } = require('../shared/config/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected', { host: conn.connection.host });
    mongoose.connection.on('error', (err) => logger.error('MongoDB error', { message: err.message }));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed', { message: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
