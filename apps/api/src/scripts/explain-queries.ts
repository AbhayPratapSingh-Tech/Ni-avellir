/**
 * Print Mongo execution plans for order history, category list, name search, and best sellers.
 *
 * Local only. Refuses Atlas URIs so this cannot touch the live shop.
 *
 *   npm run explain:queries --workspace apps/api
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../database/connect.js';
import { loadEnv } from '../config/env.js';
import { Order } from '../modules/orders/order.model.js';
import { Product } from '../modules/products/product.model.js';

type ExplainDoc = {
  executionStats?: {
    executionTimeMillis?: number;
    totalDocsExamined?: number;
    nReturned?: number;
    executionStages?: { stage?: string };
  };
  queryPlanner?: {
    winningPlan?: { stage?: string; inputStage?: { stage?: string; indexName?: string } };
  };
};

function assertLocalMongo(uri: string) {
  const host = uri.toLowerCase();
  if (host.includes('mongodb.net') || host.includes('mongodb+srv') || host.includes('atlas')) {
    console.error('Refusing to run against Atlas. Point MONGODB_URI at local Mongo.');
    process.exit(1);
  }
}

function summarize(label: string, explained: ExplainDoc) {
  const stats = explained.executionStats;
  const plan = explained.queryPlanner?.winningPlan;
  const stage = stats?.executionStages?.stage ?? plan?.stage ?? plan?.inputStage?.stage ?? 'unknown';
  const indexName = plan?.inputStage?.indexName;
  console.log(
    [
      label,
      `stage=${stage}`,
      indexName ? `index=${indexName}` : null,
      `ms=${stats?.executionTimeMillis ?? 'n/a'}`,
      `examined=${stats?.totalDocsExamined ?? 'n/a'}`,
      `returned=${stats?.nReturned ?? 'n/a'}`,
    ]
      .filter(Boolean)
      .join('  '),
  );
}

async function explain(label: string, query: unknown) {
  const explained = (await (
    query as { explain(verbosity: string): Promise<ExplainDoc> }
  ).explain('executionStats')) as ExplainDoc;
  summarize(label, explained);
}

async function main() {
  const { mongodbUri } = loadEnv();
  assertLocalMongo(mongodbUri);
  await connectDatabase(mongodbUri);
  await Order.createIndexes();
  await Product.createIndexes();

  const sampleUserId = new mongoose.Types.ObjectId();

  await explain(
    'order history (userId + not pending_payment, newest first)',
    Order.find({
      userId: sampleUserId,
      status: { $nin: ['pending_payment'] },
    }).sort({ createdAt: -1 }),
  );

  await explain(
    'product list by category (newest first)',
    Product.find({ category: 'apparel' }).sort({ createdAt: -1 }).limit(20),
  );

  await explain(
    'product name search (case-insensitive regex — expect a collection scan)',
    Product.find({ name: { $regex: 'goku', $options: 'i' } }).limit(20),
  );

  await explain(
    'best sellers (in stock, reviewCount desc)',
    Product.find({ stock: { $gt: 0 } }).sort({ reviewCount: -1, rating: -1 }).limit(6),
  );

  console.log(
    'Targets: order history and category list should use an index once those collections grow. Name search may scan until a dedicated search engine exists.',
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase().catch(() => undefined);
  });
