import { createApp, logger } from './app';
import { config } from './config';

createApp().listen(config.port, () => {
  logger.info(`📋 inspection-service listening on :${config.port} (docs at /docs)`);
});
