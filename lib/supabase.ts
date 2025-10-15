import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';

const readSupabaseFromProcess = () => {
  if (typeof process === 'undefined' || !process?.env) {
    return { url: undefined, anonKey: undefined };
  }

  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_VITE_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL;

  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_VITE_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;

  return {
    url: typeof url === 'string' ? url.trim() : undefined,
    anonKey: typeof anonKey === 'string' ? anonKey.trim() : undefined,
  };
};

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = readSupabaseFromProcess();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase no está configurado. Asegúrate de definir EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

type StorageAdapter = Pick<AsyncStorageStatic, 'getItem' | 'setItem' | 'removeItem'>;

const createMemoryStorage = (): StorageAdapter => {
  const store = new Map<string, string>();
  return {
    async getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    async setItem(key: string, value: string): Promise<void> {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
  };
};

const resolveStorage = (): StorageAdapter => {
  const isReactNative =
    typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  const hasWindow = typeof window !== 'undefined';

  if (isReactNative || hasWindow) {
    // Delay the require so Expo export (Node.js) does not execute the browser build of AsyncStorage.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    type AsyncStorageModule = AsyncStorageStatic & { default?: AsyncStorageStatic };

    const asyncStorageModule = require('@react-native-async-storage/async-storage') as AsyncStorageModule;
    return asyncStorageModule.default ?? asyncStorageModule;
  }

  return createMemoryStorage();
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  auth: {
    storage: resolveStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'simple-register',
    },
  },
});
