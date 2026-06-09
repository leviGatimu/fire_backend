import { createApp, logger } from './app';
import { config } from './config';

createApp().listen(config.port, () => {
  logger.info(`🧯 extinguisher-service listening on :${config.port} (docs at /docs)`);
});
