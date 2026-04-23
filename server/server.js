const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { env } = require('./shared/config/env');
const { logger } = require('./shared/config/logger');
const { app } = require('./app');

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(env.port, () => {
      logger.info('Smart Business OS server running', {
        port: env.port,
        mode: env.nodeEnv,
        api: `http://localhost:${env.port}/api`
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { message: error.message });
    process.exit(1);
  }
};

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Business OS Backend Running'
  });
});

startServer();

module.exports = { app, io };
