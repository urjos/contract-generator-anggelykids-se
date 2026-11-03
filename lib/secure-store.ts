import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1200;
const CHUNK_COUNT_SUFFIX = '__chunk_count';
const CHUNK_PREFIX = '__chunk_';

export type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function chunkKey(key: string, index: number): string {
  return `${key}${CHUNK_PREFIX}${index}`;
}

function countKey(key: string): string {
  return `${key}${CHUNK_COUNT_SUFFIX}`;
}

async function readChunkCount(key: string): Promise<number | null> {
  const rawCount = await SecureStore.getItemAsync(countKey(key));
  if (rawCount === null) {
    return null;
  }

  const count = Number.parseInt(rawCount, 10);
  return Number.isFinite(count) && count > 0 ? count : null;
}

async function clearChunks(key: string): Promise<void> {
  const count = await readChunkCount(key);
  if (count === null) {
    return;
  }

  await Promise.all(
    Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))),
  );
  await SecureStore.deleteItemAsync(countKey(key));
}

async function writeChunks(key: string, value: string): Promise<void> {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += CHUNK_SIZE) {
    chunks.push(value.slice(index, index + CHUNK_SIZE));
  }
  if (chunks.length === 0) {
    chunks.push('');
  }

  try {
    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk)),
    );
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  } catch (error) {
    await Promise.all(
      chunks.map((_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))),
    );
    throw error;
  }
}

const secureStoreAdapter: AuthStorage = {
  async getItem(key) {
    const count = await readChunkCount(key);
    if (count === null) {
      return SecureStore.getItemAsync(key);
    }

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index))),
    );

    if (chunks.some((chunk) => chunk === null)) {
      await clearChunks(key);
      return null;
    }

    return chunks.join('');
  },

  async setItem(key, value) {
    await clearChunks(key);
    await SecureStore.deleteItemAsync(key);
    await writeChunks(key, value);
  },

  async removeItem(key) {
    await clearChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getWebStorage(): WebStorage | null {
  const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
  return storage ?? null;
}

const webStorageAdapter: AuthStorage = {
  async getItem(key) {
    return getWebStorage()?.getItem(key) ?? null;
  },
  async setItem(key, value) {
    getWebStorage()?.setItem(key, value);
  },
  async removeItem(key) {
    getWebStorage()?.removeItem(key);
  },
};

export const authStorage: AuthStorage =
  Platform.OS === 'web' ? webStorageAdapter : secureStoreAdapter;
