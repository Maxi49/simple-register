import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';

type StorageAdapter = Pick<AsyncStorageStatic, 'getItem' | 'setItem' | 'removeItem'>;

const readSupabaseFromEnvironment = () => {
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

const createInMemoryStorage = (): StorageAdapter => {
  const store = new Map<string, string>();

  return {
    async getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    async setItem(key: string, value: string): Promise<void> {
      store.set(key, value);
    },
    async removeItem(key: string) {
      store.delete(key);
    },
  };
};

const resolveStorage = (): StorageAdapter => {
  const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  const hasWindow = typeof window !== 'undefined';

  if (isReactNative || hasWindow) {
    // Delay the require to avoid loading AsyncStorage when running under Node.js (Expo export, tests).
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const asyncStorageModule = require('@react-native-async-storage/async-storage') as AsyncStorageStatic & {
      default?: AsyncStorageStatic;
    };
    return asyncStorageModule.default ?? asyncStorageModule;
  }

  return createInMemoryStorage();
};

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = readSupabaseFromEnvironment();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase no está configurado. Asegúrate de definir EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/**
 * Cliente único de Supabase utilizado en toda la capa de datos de la aplicación.
 */
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
