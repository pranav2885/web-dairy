import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { firestore, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';

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

// Firestore sync helpers
async function syncEntryToFirestore(entry: DiaryEntry): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No authenticated user, skipping Firestore sync');
    return;
  }

  try {
    const entryRef = doc(firestore, `users/${user.uid}/entries`, entry.id);
    
    // Convert ArrayBuffer and Uint8Array to base64 for Firestore storage
    const { plaintextTitle, plaintextContent, ...entryWithoutPlaintext } = entry;
    
    const firestoreEntry = {
      ...entryWithoutPlaintext,
      encryptedContent: entry.encryptedContent ? arrayBufferToBase64(entry.encryptedContent) : null,
      encryptedTitle: entry.encryptedTitle ? arrayBufferToBase64(entry.encryptedTitle) : null,
      contentIv: entry.contentIv ? uint8ArrayToBase64(entry.contentIv) : null,
      titleIv: entry.titleIv ? uint8ArrayToBase64(entry.titleIv) : null,
      createdAt: Timestamp.fromMillis(entry.createdAt),
      updatedAt: Timestamp.fromMillis(entry.updatedAt),
      // Plaintext fields are excluded for security
    };

    await setDoc(entryRef, firestoreEntry);
    console.log('Entry synced to Firestore:', entry.id);
  } catch (error) {
    console.error('Failed to sync entry to Firestore:', error);
    throw error;
  }
}

async function deleteEntryFromFirestore(entryId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No authenticated user, skipping Firestore delete');
    return;
  }

  try {
    const entryRef = doc(firestore, `users/${user.uid}/entries`, entryId);
    await deleteDoc(entryRef);
    console.log('Entry deleted from Firestore:', entryId);
  } catch (error) {
    console.error('Failed to delete entry from Firestore:', error);
    throw error;
  }
}

// Sync entries FROM Firestore to local IndexedDB
export async function syncEntriesFromFirestore(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No authenticated user, skipping Firestore sync');
    return;
  }

  try {
    console.log('Syncing entries from Firestore...');
    const entriesRef = collection(firestore, `users/${user.uid}/entries`);
    const snapshot = await getDocs(entriesRef);
    
    const firestoreEntries: DiaryEntry[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert base64 back to ArrayBuffer and Uint8Array
      const entry: DiaryEntry = {
        id: doc.id,
        encryptedContent: data.encryptedContent ? base64ToArrayBuffer(data.encryptedContent) : null,
        encryptedTitle: data.encryptedTitle ? base64ToArrayBuffer(data.encryptedTitle) : null,
        contentIv: data.contentIv ? base64ToUint8Array(data.contentIv) : null,
        titleIv: data.titleIv ? base64ToUint8Array(data.titleIv) : null,
        tags: data.tags || [],
        autoMood: data.autoMood || null,
        userMood: data.userMood || null,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        version: data.version || 1,
        syncStatus: 'synced',
        deviceId: data.deviceId || getOrCreateDeviceId(),
        plaintextTitle: data.plaintextTitle,
        plaintextContent: data.plaintextContent,
      };
      
      firestoreEntries.push(entry);
    });
    
    // Merge with local entries (conflict resolution)
    for (const firestoreEntry of firestoreEntries) {
      const localEntry = await db.entries.get(firestoreEntry.id);
      
      if (!localEntry) {
        // New entry from Firestore, add it
        await db.entries.add(firestoreEntry);
        console.log('Added entry from Firestore:', firestoreEntry.id);
      } else if (localEntry.syncStatus === 'pending') {
        // Local has changes, check which is newer
        if (firestoreEntry.updatedAt > localEntry.updatedAt) {
          // Remote is newer, but we have pending changes - create conflict
          await addConflict(firestoreEntry.id, localEntry, firestoreEntry);
          console.log('Conflict detected for entry:', firestoreEntry.id);
        }
        // Keep local pending changes
      } else if (firestoreEntry.version > localEntry.version || firestoreEntry.updatedAt > localEntry.updatedAt) {
        // Remote is newer and no local changes, update
        await db.entries.put(firestoreEntry);
        console.log('Updated entry from Firestore:', firestoreEntry.id);
      }
    }
    
    console.log(`Synced ${firestoreEntries.length} entries from Firestore`);
  } catch (error) {
    console.error('Failed to sync entries from Firestore:', error);
    throw error;
  }
}

// Helper functions to convert between ArrayBuffer/Uint8Array and base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return uint8ArrayToBase64(bytes);
}

function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

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
  userMood: MoodMetadata | null = null,
  selectedDate?: Date | null
): Promise<string> {
  const id = uuidv4();
  const now = selectedDate ? selectedDate.getTime() : Date.now();
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

  // Sync to Firestore
  try {
    await syncEntryToFirestore(entry);
    await db.entries.update(id, { syncStatus: 'synced' });
  } catch (error) {
    console.error('Failed to sync new entry to Firestore:', error);
    // Entry stays as 'pending' for later sync
  }

  return id;
}

export async function updateEntry(
  id: string,
  updates: Partial<Pick<DiaryEntry, 'plaintextTitle' | 'plaintextContent' | 'tags' | 'userMood' | 'autoMood'>>
): Promise<void> {
  const entry = await db.entries.get(id);
  if (!entry) throw new Error('Entry not found');

  const updatedEntry = {
    ...updates,
    updatedAt: Date.now(),
    version: entry.version + 1,
    syncStatus: 'pending' as SyncStatus,
  };

  await db.entries.update(id, updatedEntry);

  // Update search index if content changed
  if (updates.plaintextTitle !== undefined || updates.plaintextContent !== undefined) {
    const newTitle = updates.plaintextTitle ?? entry.plaintextTitle ?? '';
    const newContent = updates.plaintextContent ?? entry.plaintextContent ?? '';
    await updateSearchIndex(id, newTitle, newContent);
  }

  // Sync to Firestore
  try {
    const fullEntry = await db.entries.get(id);
    if (fullEntry) {
      await syncEntryToFirestore(fullEntry);
      await db.entries.update(id, { syncStatus: 'synced' });
    }
  } catch (error) {
    console.error('Failed to sync updated entry to Firestore:', error);
    // Entry stays as 'pending' for later sync
  }
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id);
  await db.searchIndex.delete(id);
  
  // Delete from Firestore
  try {
    await deleteEntryFromFirestore(id);
  } catch (error) {
    console.error('Failed to delete entry from Firestore:', error);
    // Continue even if Firestore delete fails
  }
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
