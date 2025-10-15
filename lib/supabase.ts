import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const env = process.env as Record<string, string | undefined>;

const resolveEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
};

const SUPABASE_URL = resolveEnv(
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_VITE_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_URL'
);

const SUPABASE_ANON_KEY = resolveEnv(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY'
);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase no esta configurado. Asegurate de definir EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  auth: {
    storage: AsyncStorage,
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
