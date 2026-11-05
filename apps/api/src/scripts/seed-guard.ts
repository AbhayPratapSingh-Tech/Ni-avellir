/**
 * seed and seed:ops delete rows before insert. A laptop .env can point at Atlas
 * while NODE_ENV stays development, so the host is the check that matters.
 */

export function seedBlockReason(uri: string): string | null {
  const host = uri.toLowerCase();
  const atlas = host.includes('mongodb.net') || host.includes('mongodb+srv') || host.includes('atlas');
  if (!atlas) return null;
  if (process.env.SEED_ALLOW_ATLAS === 'yes') return null;
  return 'Refusing to seed Atlas. This command deletes products, coupons, or stores. Set SEED_ALLOW_ATLAS=yes only when you mean to wipe that database.';
}

export function assertSeedAllowed(uri: string) {
  const reason = seedBlockReason(uri);
  if (!reason) return;
  console.error(reason);
  process.exit(1);
}
