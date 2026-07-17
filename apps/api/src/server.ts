import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './common/logger/logger.js';

const env = loadEnv();
const app = createApp(env);

app.listen(env.port, () => {
  logger.info({ port: env.port, environment: env.nodeEnv }, 'API server listening');
});
