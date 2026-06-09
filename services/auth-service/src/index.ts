import { createApp, logger } from './app';
import { config } from './config';

const app = createApp();
app.listen(config.port, () => {
  logger.info(`🔐 auth-service listening on :${config.port} (docs at /docs)`);
});
