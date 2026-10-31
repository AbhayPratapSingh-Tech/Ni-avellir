/**
 * Score visual search against labeled catalog photos.
 *
 * Local Mongo only. Does not write. Does not call POST /products/visual-search
 * (that route is rate-limited). Hit rate is printed and does not fail the run.
 * A product slug that is not in the database does fail the run.
 *
 *   npm run eval:visual-search --workspace apps/api
 *
 * Live photos need OPENAI_API_KEY (and a vision-capable model). Without a key,
 * the parse / no-key / fake-SKU checks still run.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../database/connect.js';
import { loadEnv, type Env } from '../config/env.js';
import { Product } from '../modules/products/product.model.js';
import { ProductService } from '../modules/products/product.service.js';
import {
  parseHints,
  VISUAL_SEARCH_PROMPT,
  type VisualSearchHints,
} from '../modules/products/visual-search.js';

type PositiveFixture = { slug: string; franchise: string };
type NegativeFixture = { id: 'blank' | 'solid' };
type FixtureFile = { positives: PositiveFixture[]; negatives: NegativeFixture[] };

type ListedProduct = { slug?: string; sku?: string };

const BLANK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
);
const SOLID_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
  'base64',
);

const NEGATIVE_IMAGES: Record<NegativeFixture['id'], Buffer> = {
  blank: BLANK_PNG,
  solid: SOLID_PNG,
};

function assertLocalMongo(uri: string) {
  const host = uri.toLowerCase();
  if (host.includes('mongodb.net') || host.includes('mongodb+srv') || host.includes('atlas')) {
    console.error('Refusing to run against Atlas. Point MONGODB_URI at local Mongo.');
    process.exit(1);
  }
}

function sameHints(actual: VisualSearchHints | null, expected: VisualSearchHints | null) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function checkParseHints(): string[] {
  const cases: Array<{ name: string; raw: string; expected: VisualSearchHints | null }> = [
    {
      name: 'plain json',
      raw: '{"search":"ohma tee","franchise":"Kengan Ashura","category":"apparel"}',
      expected: { search: 'ohma tee', franchise: 'Kengan Ashura', category: 'apparel' },
    },
    {
      name: 'markdown fence',
      raw: '```json\n{"search":"poster"}\n```',
      expected: { search: 'poster' },
    },
    {
      name: 'unknown category dropped',
      raw: '{"search":"mug","category":"boots"}',
      expected: { search: 'mug' },
    },
    {
      name: 'whitespace collapsed',
      raw: '{"search":"ohma   tee"}',
      expected: { search: 'ohma tee' },
    },
    {
      name: 'empty search',
      raw: '{"search":"   "}',
      expected: null,
    },
    {
      name: 'garbage',
      raw: 'not json',
      expected: null,
    },
    {
      name: 'fake sku is not a hint field',
      raw: '{"search":"FAKE-SKU-EVAL-XYZ","sku":"FAKE-SKU-EVAL-XYZ","category":"nope","franchise":""}',
      expected: { search: 'FAKE-SKU-EVAL-XYZ' },
    },
  ];

  const failures: string[] = [];
  for (const testCase of cases) {
    const actual = parseHints(testCase.raw);
    if (!sameHints(actual, testCase.expected)) {
      failures.push(
        `parse ${testCase.name}: got ${JSON.stringify(actual)} expected ${JSON.stringify(testCase.expected)}`,
      );
    }
  }
  return failures;
}

async function slugsOutsideCatalog(products: ListedProduct[]): Promise<string[]> {
  const slugs = products.map((product) => product.slug).filter((slug): slug is string => Boolean(slug));
  if (slugs.length === 0) return [];
  const found = await Product.find({ slug: { $in: slugs } })
    .select('slug')
    .lean();
  const known = new Set(found.map((product) => product.slug));
  return slugs.filter((slug) => !known.has(slug));
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    throw new Error(`image download failed ${response.status} ${url}`);
  }
  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new Error(`image download was empty ${url}`);
  }
  return { buffer, mimeType };
}

async function main() {
  const fixturePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'fixtures',
    'visual-search.json',
  );
  const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8')) as FixtureFile;
  const env = loadEnv();
  const promptHash = createHash('sha256').update(VISUAL_SEARCH_PROMPT).digest('hex').slice(0, 12);
  const model = env.openaiVisionModel || env.openaiModel || 'gpt-4o-mini';

  console.log(`model=${model}  prompt=${promptHash}`);

  const failures = checkParseHints();
  console.log(failures.length === 0 ? 'parse: pass' : `parse: FAIL (${failures.length})`);

  assertLocalMongo(env.mongodbUri);
  await connectDatabase(env.mongodbUri);

  const service = new ProductService();
  const disabled: Env = { ...env, aiEnabled: false, openaiApiKey: undefined };
  const withoutKey = await service.visualSearch(disabled, BLANK_PNG, 'image/png');
  if (withoutKey.reason !== 'vision_unavailable' || withoutKey.products.length !== 0) {
    failures.push(
      `no-key: expected empty vision_unavailable, got ${JSON.stringify({
        reason: withoutKey.reason,
        count: withoutKey.products.length,
      })}`,
    );
    console.log('no-key: FAIL');
  } else {
    console.log('no-key: pass');
  }

  const fakeHints = parseHints(
    '{"search":"FAKE-SKU-EVAL-XYZ","sku":"FAKE-SKU-EVAL-XYZ","category":"nope"}',
  );
  const fakeListed = fakeHints
    ? await service.list({ search: fakeHints.search, limit: 20, page: 1 })
    : { items: [] };
  const fakeItems = fakeListed.items as ListedProduct[];
  const invented = fakeItems.filter((product) => product.sku === 'FAKE-SKU-EVAL-XYZ');
  const fakeUnknown = await slugsOutsideCatalog(fakeItems);
  if (!fakeHints || invented.length > 0 || fakeUnknown.length > 0) {
    failures.push('fake-sku: a hint named a SKU that showed up as a product');
    console.log('fake-sku: FAIL');
  } else {
    console.log('fake-sku: pass');
  }

  const live = Boolean(env.aiEnabled && env.openaiApiKey);
  if (!live) {
    console.log('live: skipped (set OPENAI_API_KEY and AI_ENABLED to score photos)');
  } else {
    let hits = 0;
    for (const fixture of fixtures.positives) {
      const product = await Product.findOne({ slug: fixture.slug })
        .select('slug franchise imageUrl stock')
        .lean();
      if (!product) {
        failures.push(`missing fixture slug ${fixture.slug} — seed local Mongo first`);
        console.log(`${fixture.slug}  setup-fail  not in local catalog`);
        continue;
      }
      if (product.franchise !== fixture.franchise) {
        failures.push(
          `${fixture.slug} franchise is ${product.franchise}, fixture says ${fixture.franchise}`,
        );
      }
      if (product.stock <= 0) {
        failures.push(`${fixture.slug} is out of stock, so visual search cannot return it`);
        console.log(`${fixture.slug}  setup-fail  stock=0`);
        continue;
      }
      const image = await downloadImage(product.imageUrl);
      const result = await service.visualSearch(env, image.buffer, image.mimeType);
      const unknown = await slugsOutsideCatalog(result.products as ListedProduct[]);
      if (unknown.length > 0) {
        failures.push(`${fixture.slug} returned slugs not in catalog: ${unknown.join(', ')}`);
      }
      const hit = result.products.some((item) => (item as ListedProduct).slug === fixture.slug);
      if (hit) hits += 1;
      console.log(
        [
          fixture.slug,
          hit ? 'hit' : 'miss',
          `query="${result.query}"`,
          result.franchise ? `franchise="${result.franchise}"` : null,
          result.category ? `category="${result.category}"` : null,
          `returned=${result.products.length}`,
          result.reason ?? null,
          unknown.length ? `unknown=${unknown.join(',')}` : null,
        ]
          .filter(Boolean)
          .join('  '),
      );
    }
    console.log(`hit ${hits}/${fixtures.positives.length}`);

    let negativesEmpty = 0;
    for (const fixture of fixtures.negatives) {
      const image = NEGATIVE_IMAGES[fixture.id];
      if (!image) {
        failures.push(`unknown negative fixture ${fixture.id}`);
        continue;
      }
      const result = await service.visualSearch(env, image, 'image/png');
      const unknown = await slugsOutsideCatalog(result.products as ListedProduct[]);
      if (unknown.length > 0) {
        failures.push(`${fixture.id} returned slugs not in catalog: ${unknown.join(', ')}`);
      }
      const empty = result.products.length === 0;
      if (empty) negativesEmpty += 1;
      console.log(
        [
          fixture.id,
          empty ? 'empty' : 'non-empty',
          `query="${result.query}"`,
          `returned=${result.products.length}`,
          result.reason ?? null,
          unknown.length ? `unknown=${unknown.join(',')}` : null,
        ]
          .filter(Boolean)
          .join('  '),
      );
    }
    console.log(`negatives empty ${negativesEmpty}/${fixtures.negatives.length}`);
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  } else {
    console.log('catalog integrity: pass');
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase().catch(() => undefined);
  });
