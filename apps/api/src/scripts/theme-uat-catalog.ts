/**
 * Point every product in nidavellir_uat at an anime franchise.
 * Categories, prices, stock, slugs, and ids stay. Production is never opened.
 *
 * Usage: npm run theme:uat-catalog --workspace apps/api
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Product } from '../modules/products/product.model.js';

const UAT_DB = 'nidavellir_uat';
const KEEP_TAGS = new Set(['you-may-also-like', 'drop-zone-eligible', 'restocking']);

const FRANCHISES = [
  { name: 'Solo Leveling', slug: 'solo-leveling', lines: ['Shadow Monarch', 'Arise', 'Jinwoo Gate', 'Statue of God'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg'] },
  { name: 'Attack on Titan', slug: 'aot', lines: ['Wings of Freedom', 'Survey Corps', 'Walls of Paradis', 'ODM Gear'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg'] },
  { name: 'Demon Slayer', slug: 'demon-slayer', lines: ['Hinokami', 'Water Breathing', 'Hashira', 'Nezuko'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg'] },
  { name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', lines: ['Domain Expansion', 'Gojo', 'Sukuna', 'Cursed Energy'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg'] },
  { name: 'Naruto', slug: 'naruto', lines: ['Hidden Leaf', 'Nine Tails', 'Hokage', 'Rasengan'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-dE6UHbFFg1A5.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20-HHxhPj5JD13a.jpg'] },
  { name: 'One Piece', slug: 'one-piece', lines: ['Straw Hat', 'Grand Line', 'Wanted Poster', 'Thousand Sunny'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg'] },
  { name: 'Dragon Ball Z', slug: 'dragon-ball', lines: ['Super Saiyan', 'Kamehameha', 'Capsule Corp', 'Spirit Bomb'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx813-ZhnFNOeCU5dQ.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/813-03ZLvWJgR6Wd.jpg'] },
  { name: 'Spy x Family', slug: 'spy-x-family', lines: ['Forger', 'Anya', 'Twilight', 'Bond'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-Z7xSvkRxHKfj.jpg'] },
  { name: 'Chainsaw Man', slug: 'chainsaw-man', lines: ['Devil Hunter', 'Pochita', 'Public Safety', 'Makima'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-o8IRwCGVr9KW.jpg'] },
  { name: 'My Hero Academia', slug: 'my-hero-academia', lines: ['Plus Ultra', 'One For All', 'UA High', 'Hero Costume'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-nYh85uj2Fuwr.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21459-yeVkolGKdGUV.jpg'] },
  { name: 'Death Note', slug: 'death-note', lines: ['Shinigami', 'Kira', 'L', 'Death Note'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg'] },
  { name: 'Kengan Ashura', slug: 'kengan-ashura', lines: ['Kengan Match', 'Ohma', 'Ashura Arena', 'Nogi'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx100891-vPfnfkzizYFe.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/100891-ykOVRCdJGNhi.jpg'] },
  { name: 'Hunter x Hunter', slug: 'hunter-x-hunter', lines: ['Hunter License', 'Gon', 'Killua', 'Nen'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-y5gsT1hoHuHw.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-8WkkTZ6duKpq.jpg'] },
  { name: 'Fullmetal Alchemist', slug: 'fullmetal-alchemist', lines: ['Fullmetal', 'Alchemy', 'Elric', 'Philosopher'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg'] },
  { name: 'Bleach', slug: 'bleach', lines: ['Soul Reaper', 'Zangetsu', 'Soul Society', 'Bankai'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-d2GmRkJbMopq.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/269-08ar2HJOUAuL.jpg'] },
  { name: 'Black Clover', slug: 'black-clover', lines: ['Black Bulls', 'Asta', 'Five Leaf', 'Magic Knight'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-fyh8o7gNbha0.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/97940-1URQdQ4U1a0b.jpg'] },
  { name: 'Cowboy Bebop', slug: 'cowboy-bebop', lines: ['See You Space Cowboy', 'Bebop', 'Spike', 'Bounty'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-GCsPm7waJ4kS.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-OquNCNB6srGe.jpg'] },
  { name: 'Steins;Gate', slug: 'steins-gate', lines: ['Divergence', 'Lab Member', 'Reading Steiner', 'Time Leap'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-tIUXF2gfU8Sg.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/n9253-JIhmKgBKsWUN.jpg'] },
  { name: 'Code Geass', slug: 'code-geass', lines: ['Zero', 'Geass', 'Black Knights', 'Lelouch'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1575-hsmWM2ydNm1m.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1575.jpg'] },
  { name: 'Vinland Saga', slug: 'vinland-saga', lines: ['Vinland', 'Askeladd', 'Thorfinn', 'Farmland'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-2fhDFPCuMNiz.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101348-pivKKffCAwAY.jpg'] },
  { name: 'Haikyuu', slug: 'haikyuu', lines: ['Karasuno', 'Fly High', 'Quick Attack', 'Court'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-ooZUyBe4ptp9.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20464-PpYjO9cPN1gs.jpg'] },
  { name: 'Frieren', slug: 'frieren', lines: ["Beyond Journey's End", 'Mage Party', 'Himmel', 'Spell'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg'] },
  { name: 'Sword Art Online', slug: 'sword-art-online', lines: ['Aincrad', 'Dual Blades', 'NerveGear', 'Kirito'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-SxYDUzdr9rh2.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11757-TlEEV9weG4Ag.jpg'] },
  { name: 'Tokyo Ghoul', slug: 'tokyo-ghoul', lines: ['Kagune', 'Anteiku', 'Kaneki', 'Mask'], art: ['https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b20605-k665mVkSug8D.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20605-RCJ7M71zLmrh.jpg'] },
] as const;

const KINDS: Array<{ test: RegExp; label: string; tag: string }> = [
  { test: /hoodie|crewneck/, label: 'Hoodie', tag: 'hoodie' },
  { test: /jersey/, label: 'Jersey', tag: 'jersey' },
  { test: /jacket/, label: 'Jacket', tag: 'jacket' },
  { test: /tee|t-shirt|shirt/, label: 'Tee', tag: 'tee' },
  { test: /shorts/, label: 'Shorts', tag: 'shorts' },
  { test: /beanie|cap|hat/, label: 'Cap', tag: 'hat' },
  { test: /poster|print/, label: 'Poster', tag: 'poster' },
  { test: /bust|statue|figurine|guardian|\bfigure\b/, label: 'Figure', tag: 'figure' },
  { test: /deskmat|mousepad/, label: 'Deskmat', tag: 'deskmat' },
  { test: /keycap|keyboard/, label: 'Keycap Set', tag: 'keycap' },
  { test: /mug|cup|coaster/, label: 'Mug', tag: 'mug' },
  { test: /keychain/, label: 'Keychain', tag: 'keychain' },
  { test: /tote|bag/, label: 'Tote', tag: 'bag' },
  { test: /pin|coin|plaque/, label: 'Pin', tag: 'pin' },
  { test: /controller|grip/, label: 'Controller Grip', tag: 'controller' },
  { test: /stand|dock|cradle/, label: 'Stand', tag: 'stand' },
  { test: /cable/, label: 'Cable Kit', tag: 'cable' },
  { test: /light/, label: 'Desk Light', tag: 'light' },
  { test: /headset/, label: 'Headset Dock', tag: 'headset' },
  { test: /wrist/, label: 'Wrist Rest', tag: 'wrist' },
  { test: /bundle|set/, label: 'Bundle', tag: 'bundle' },
];

const CATEGORY_KIND = {
  apparel: { label: 'Tee', tag: 'tee' },
  'desk-gear': { label: 'Deskmat', tag: 'deskmat' },
  collectibles: { label: 'Poster', tag: 'poster' },
  'limited-drops': { label: 'Drop', tag: 'drop' },
} as const;

function hideUri(message: string) {
  return message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb://***@');
}

function databaseName(uri: string) {
  const pathPart = uri.split('?')[0]?.replace(/^mongodb(\+srv)?:\/\/[^/]*\//, '') ?? '';
  return pathPart.split('/')[0] ?? '';
}

function uatUriFromDevFile() {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const file = path.join(apiRoot, '.env.development');
  const line = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .find((entry) => entry.startsWith('MONGODB_URI='));
  if (!line) {
    throw new Error('MONGODB_URI is missing from apps/api/.env.development');
  }
  const raw = line.slice('MONGODB_URI='.length).trim().replace(/^['"]|['"]$/g, '');
  const current = databaseName(raw);
  if (current === UAT_DB) return raw;
  if (current !== 'nidavellir_dev') {
    throw new Error(`Refusing to rewrite database "${current || '(none)'}".`);
  }
  const from = '/nidavellir_dev';
  const at = raw.lastIndexOf(from);
  if (at < 0) {
    throw new Error('Could not find the database name in the URI path.');
  }
  const next = `${raw.slice(0, at)}/${UAT_DB}${raw.slice(at + from.length)}`;
  if (databaseName(next) !== UAT_DB) {
    throw new Error('Rewritten URI is not the UAT database.');
  }
  return next;
}

function hash(value: string) {
  let n = 0;
  for (let i = 0; i < value.length; i += 1) n = (n * 31 + value.charCodeAt(i)) >>> 0;
  return n;
}

function kindFor(name: string, tags: string[], category: keyof typeof CATEGORY_KIND) {
  const blob = `${name} ${tags.join(' ')}`.toLowerCase();
  return KINDS.find((kind) => kind.test.test(blob)) ?? CATEGORY_KIND[category];
}

async function main() {
  const uri = uatUriFromDevFile();
  if (databaseName(uri) !== UAT_DB) {
    throw new Error('Refusing to update a database other than nidavellir_uat.');
  }

  await mongoose.connect(uri);
  const connected = mongoose.connection.db?.databaseName;
  if (connected !== UAT_DB) {
    throw new Error(`Connected to "${connected ?? 'unknown'}", not ${UAT_DB}.`);
  }

  const products = await Product.find({}).select('name slug category tags').sort({ slug: 1 }).lean();
  let updated = 0;
  for (const [index, product] of products.entries()) {
    const category = product.category as keyof typeof CATEGORY_KIND;
    const franchise = FRANCHISES[index % FRANCHISES.length]!;
    const kind = kindFor(product.name, product.tags ?? [], category);
    const line = franchise.lines[hash(`${product.slug}:line`) % franchise.lines.length]!;
    const art = franchise.art[hash(`${product.slug}:art`) % franchise.art.length]!;
    const kept = (product.tags ?? []).filter((tag) => KEEP_TAGS.has(tag));
    const tags = [...new Set([...kept, 'anime', franchise.slug, kind.tag])];
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          name: `${line} ${kind.label}`,
          franchise: franchise.name,
          description: `${franchise.name} ${kind.label.toLowerCase()}. ${line} artwork on the ${category.replace(/-/g, ' ')} shelf.`,
          imageUrl: art,
          galleryUrls: [...franchise.art],
          tags,
        },
      },
    );
    updated += 1;
  }

  const sample = await Product.find({}).select('name category franchise imageUrl').limit(8).lean();
  const categories = await Product.distinct('category');
  const franchises = await Product.distinct('franchise');
  console.log(
    JSON.stringify(
      {
        database: connected,
        updated,
        categories,
        franchiseCount: franchises.length,
        franchises,
        sample: sample.map((item) => ({
          name: item.name,
          category: item.category,
          franchise: item.franchise,
          image: item.imageUrl,
        })),
      },
      null,
      2,
    ),
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(hideUri(message));
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
