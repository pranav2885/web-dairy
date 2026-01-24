import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Mood metadata types
export interface MoodMetadata {
  score: number; // -5 to +5
  category: MoodCategory;
  emoji: string;
  confidence?: number; // 0-1, only for auto-detected
}

export type MoodCategory =
  | 'ecstatic'
  | 'joyful'
  | 'content'
  | 'hopeful'
  | 'neutral'
  | 'thoughtful'
  | 'melancholy'
  | 'anxious'
  | 'distressed';

export type SyncStatus = 'pending' | 'synced' | 'conflict';

// Main diary entry interface
export interface DiaryEntry {
  id: string;
  encryptedContent: ArrayBuffer | null;
  encryptedTitle: ArrayBuffer | null;
  contentIv: Uint8Array | null;
  titleIv: Uint8Array | null;
  // Unencrypted for filtering without decryption
  tags: string[];
  autoMood: MoodMetadata | null;
  userMood: MoodMetadata | null;
  createdAt: number;
  updatedAt: number;
  version: number;
  syncStatus: SyncStatus;
  deviceId: string;
  // For local display before encryption
  plaintextTitle?: string;
  plaintextContent?: string;
}

// Search index for decrypted content
export interface SearchIndexEntry {
  entryId: string;
  words: string[];
  titleWords: string[];
}

// User preferences
export interface UserPref {
  key: string;
  value: unknown;
}

// Encrypted crypto keys storage
export interface StoredCryptoKey {
  keyId: string;
  encryptedKey: ArrayBuffer;
  salt: Uint8Array;
  authMethod: 'google' | 'email';
}

// Conflict tracking
export interface ConflictRecord {
  entryId: string;
  localVersion: DiaryEntry;
  remoteVersion: DiaryEntry;
  detectedAt: number;
  resolved: boolean;
}

// Database class
class DiaryVaultDB extends Dexie {
  entries!: Table<DiaryEntry, string>;
  searchIndex!: Table<SearchIndexEntry, string>;
  userPrefs!: Table<UserPref, string>;
  cryptoKeys!: Table<StoredCryptoKey, string>;
  conflicts!: Table<ConflictRecord, string>;

  constructor() {
    super('diary-vault');

    this.version(1).stores({
      entries: 'id, createdAt, updatedAt, version, syncStatus, deviceId, *tags, [userMood.category+createdAt]',
      searchIndex: 'entryId, *words, *titleWords',
      userPrefs: 'key',
      cryptoKeys: 'keyId',
      conflicts: 'entryId, detectedAt, resolved',
    });
  }
}

// Database instance
export const db = new DiaryVaultDB();

// Helper to generate device ID
export function getOrCreateDeviceId(): string {
  const stored = localStorage.getItem('diary-vault-device-id');
  if (stored) return stored;
  
  const newId = uuidv4();
  localStorage.setItem('diary-vault-device-id', newId);
  return newId;
}

// Helper functions for entries
export async function createEntry(
  plaintextTitle: string,
  plaintextContent: string,
  tags: string[] = [],
  autoMood: MoodMetadata | null = null,
  userMood: MoodMetadata | null = null
): Promise<string> {
  const id = uuidv4();
  const now = Date.now();
  const deviceId = getOrCreateDeviceId();

  const entry: DiaryEntry = {
    id,
    encryptedContent: null,
    encryptedTitle: null,
    contentIv: null,
    titleIv: null,
    tags,
    autoMood,
    userMood,
    createdAt: now,
    updatedAt: now,
    version: 1,
    syncStatus: 'pending',
    deviceId,
    plaintextTitle,
    plaintextContent,
  };

  await db.entries.add(entry);
  
  // Update search index
  await updateSearchIndex(id, plaintextTitle, plaintextContent);

  return id;
}

export async function updateEntry(
  id: string,
  updates: Partial<Pick<DiaryEntry, 'plaintextTitle' | 'plaintextContent' | 'tags' | 'userMood' | 'autoMood'>>
): Promise<void> {
  const entry = await db.entries.get(id);
  if (!entry) throw new Error('Entry not found');

  await db.entries.update(id, {
    ...updates,
    updatedAt: Date.now(),
    version: entry.version + 1,
    syncStatus: 'pending',
  });

  // Update search index if content changed
  if (updates.plaintextTitle !== undefined || updates.plaintextContent !== undefined) {
    const newTitle = updates.plaintextTitle ?? entry.plaintextTitle ?? '';
    const newContent = updates.plaintextContent ?? entry.plaintextContent ?? '';
    await updateSearchIndex(id, newTitle, newContent);
  }
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id);
  await db.searchIndex.delete(id);
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  return db.entries.get(id);
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  return db.entries.orderBy('createdAt').reverse().toArray();
}

export async function getEntriesByDateRange(startDate: number, endDate: number): Promise<DiaryEntry[]> {
  return db.entries
    .where('createdAt')
    .between(startDate, endDate)
    .reverse()
    .sortBy('createdAt');
}

export async function getEntriesByMood(category: MoodCategory): Promise<DiaryEntry[]> {
  return db.entries
    .filter(entry => entry.userMood?.category === category)
    .toArray();
}

export async function getEntriesByTag(tag: string): Promise<DiaryEntry[]> {
  return db.entries
    .where('tags')
    .equals(tag)
    .toArray();
}

// Search functionality
async function updateSearchIndex(entryId: string, title: string, content: string): Promise<void> {
  const tokenize = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\\w\\s]/g, ' ')
      .split(/\\s+/)
      .filter(word => word.length > 2);
  };

  const words = tokenize(content);
  const titleWords = tokenize(title);

  await db.searchIndex.put({
    entryId,
    words,
    titleWords,
  });
}

export async function searchEntries(query: string): Promise<DiaryEntry[]> {
  const tokens = query
    .toLowerCase()
    .split(/\\s+/)
    .filter(word => word.length > 2);

  if (tokens.length === 0) return [];

  // Find matching entry IDs from search index
  const matchingIds = new Set<string>();

  for (const token of tokens) {
    const matches = await db.searchIndex
      .filter(idx => 
        idx.words.some(w => w.includes(token)) ||
        idx.titleWords.some(w => w.includes(token))
      )
      .toArray();

    matches.forEach(m => matchingIds.add(m.entryId));
  }

  // Fetch and return entries
  const entries = await db.entries.bulkGet([...matchingIds]);
  return entries.filter((e): e is DiaryEntry => e !== undefined);
}

// User preferences helpers
export async function getUserPref<T>(key: string, defaultValue: T): Promise<T> {
  const pref = await db.userPrefs.get(key);
  return pref ? (pref.value as T) : defaultValue;
}

export async function setUserPref<T>(key: string, value: T): Promise<void> {
  await db.userPrefs.put({ key, value });
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const entries = await db.entries.toArray();
  const tagSet = new Set<string>();
  entries.forEach(e => e.tags.forEach(t => tagSet.add(t)));
  return [...tagSet].sort();
}

// Pending sync entries
export async function getPendingEntries(): Promise<DiaryEntry[]> {
  return db.entries.where('syncStatus').equals('pending').toArray();
}

// Conflict management
export async function addConflict(
  entryId: string,
  localVersion: DiaryEntry,
  remoteVersion: DiaryEntry
): Promise<void> {
  await db.conflicts.put({
    entryId,
    localVersion,
    remoteVersion,
    detectedAt: Date.now(),
    resolved: false,
  });
  
  await db.entries.update(entryId, { syncStatus: 'conflict' });
}

export async function getUnresolvedConflicts(): Promise<ConflictRecord[]> {
  return db.conflicts.where('resolved').equals(0).toArray();
}

export async function resolveConflict(
  entryId: string,
  keepVersion: 'local' | 'remote' | 'both'
): Promise<void> {
  const conflict = await db.conflicts.get(entryId);
  if (!conflict) return;

  if (keepVersion === 'local') {
    // Keep local, mark as pending to push
    await db.entries.update(entryId, { syncStatus: 'pending' });
  } else if (keepVersion === 'remote') {
    // Replace with remote version
    await db.entries.put({
      ...conflict.remoteVersion,
      syncStatus: 'synced',
    });
  } else {
    // Keep both - create a copy of remote as new entry
    const remoteAsCopy = {
      ...conflict.remoteVersion,
      id: uuidv4(),
      syncStatus: 'pending' as SyncStatus,
    };
    await db.entries.add(remoteAsCopy);
    await db.entries.update(entryId, { syncStatus: 'synced' });
  }

  await db.conflicts.update(entryId, { resolved: true });
}
