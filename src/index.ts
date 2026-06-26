import { createApp, logAppStartup } from './server/createApp';
import { appConfig } from './config';
import { logger } from './utils/logger';
import { db } from './database/connection';
import { createRedisClient } from './utils/redis';
import { closeRedisConnection } from './middleware';
import { initializeBlacklistSystem } from './utils/tokenBlacklist';
import { startRefreshTokenCleanup } from './utils/refreshToken';

let app = createApp();

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully');
  await Promise.all([db.close(), closeRedisConnection()]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully');
  await Promise.all([db.close(), closeRedisConnection()]);
  process.exit(0);
});

async function startServer() {
  const PORT = appConfig.server.port;
  let redisConnected = false;

  try {
    logger.info('Initializing Redis connection...');
    await createRedisClient();
    redisConnected = true;
    logger.info('Redis connection established');
    app = createApp({ withOAuth: true });
    initializeBlacklistSystem();
    startRefreshTokenCleanup();
  } catch (error) {
    logger.error('Failed to initialize Redis, starting without Redis support:', error);
    app = createApp({ withOAuth: false });
  }

  app.listen(PORT, () => {
    logAppStartup(PORT, redisConnected);
  });
}

startServer();

export default app;
