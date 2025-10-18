import { registerGracefulShutdown, startAuthServer } from './server';
import { logger } from './utils/logger';

(async () => {
  try {
    const started = await startAuthServer();
    registerGracefulShutdown(started);
  } catch (error) {
    logger.error('Failed to start authentication server', error);
    process.exit(1);
  }
})();
