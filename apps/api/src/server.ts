import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './common/logger/logger.js';
import { connectDatabase } from './database/connect.js';

async function main() {
  const env = loadEnv();
  const app = createApp(env);

  try {
    await connectDatabase(env.mongodbUri);
  } catch (error) {
    logger.error(
      error,
      'MongoDB connection failed. Start MongoDB locally, or use mobile mock mode (`appConfig.dataSource = "mock"`) with `npm run dev` only.',
    );
    process.exit(1);
  }

  app.listen(env.port, () => {
    logger.info({ port: env.port, environment: env.nodeEnv }, 'API server listening');
  });
}

main().catch((error) => {
  logger.error(error, 'Failed to start API server');
  process.exit(1);
});
