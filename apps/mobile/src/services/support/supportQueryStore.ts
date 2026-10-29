import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuestSessionId } from '../session/guestSession';

const STORAGE_KEY = 'nidavellir_support_queries_v1';

export type SupportQueryStatus = 'open' | 'resolved';

export type SupportQueryRecord = {
  id: string;
  caseNumber: string;
  status: SupportQueryStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  /** email:… / phone:… / guest:… used to scope list */
  ownerKeys: string[];
  name: string;
  email: string;
  phone: string;
  category: string;
  subcategory: string;
  orderId: string;
  productSku: string;
  comments: string;
};

function randomId() {
  return `qry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function caseNumberFromId(id: string) {
  const tail = id.replace(/\W/g, '').slice(-6).toUpperCase();
  return `QRY-${tail}`;
}

async function readAll(): Promise<SupportQueryRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SupportQueryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: SupportQueryRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function buildOwnerKeys(input: {
  email?: string;
  phone?: string;
  isGuest?: boolean;
  guestId?: string;
}): string[] {
  const keys: string[] = [];
  const email = (input.email || '').trim().toLowerCase();
  const phone = (input.phone || '').replace(/\D/g, '');
  if (email) keys.push(`email:${email}`);
  if (phone.length >= 10) keys.push(`phone:${phone.slice(-10)}`);
  if (input.isGuest && input.guestId) keys.push(`guest:${input.guestId}`);
  return keys;
}

export async function resolveOwnerKeysForUser(user: {
  email?: string;
  phone?: string;
  isGuest?: boolean;
} | null): Promise<string[]> {
  if (!user || user.isGuest) {
    const guestId = await getGuestSessionId();
    return buildOwnerKeys({ isGuest: true, guestId });
  }
  return buildOwnerKeys({
    email: user.email,
    phone: user.phone,
    isGuest: false,
  });
}

export async function listSupportQueriesForUser(user: {
  email?: string;
  phone?: string;
  isGuest?: boolean;
} | null): Promise<SupportQueryRecord[]> {
  const keys = await resolveOwnerKeysForUser(user);
  const keySet = new Set(keys);
  const all = await readAll();
  return all
    .filter((item) => item.ownerKeys.some((k) => keySet.has(k)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSupportQueryById(id: string): Promise<SupportQueryRecord | null> {
  const all = await readAll();
  return all.find((item) => item.id === id) || null;
}

export async function createSupportQuery(
  input: Omit<SupportQueryRecord, 'id' | 'caseNumber' | 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'ownerKeys'> & {
    ownerKeys: string[];
  },
): Promise<SupportQueryRecord> {
  const now = new Date().toISOString();
  const id = randomId();
  const record: SupportQueryRecord = {
    ...input,
    id,
    caseNumber: caseNumberFromId(id),
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.unshift(record);
  await writeAll(all.slice(0, 200));
  return record;
}

export async function markSupportQueryResolved(id: string): Promise<SupportQueryRecord | null> {
  const all = await readAll();
  const current = all.find((item) => item.id === id);
  if (!current) return null;
  const now = new Date().toISOString();
  const next: SupportQueryRecord = {
    ...current,
    status: 'resolved',
    updatedAt: now,
    resolvedAt: now,
  };
  const index = all.findIndex((item) => item.id === id);
  all[index] = next;
  await writeAll(all);
  return next;
}

export function statusLabel(status: SupportQueryStatus): string {
  return status === 'resolved' ? 'Resolved' : 'Pending';
}

/** Sheet / API status string (Pending | Resolved). */
export function sheetStatus(status: SupportQueryStatus): 'Pending' | 'Resolved' {
  return status === 'resolved' ? 'Resolved' : 'Pending';
}
