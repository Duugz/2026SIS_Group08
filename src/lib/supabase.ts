import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Social sign-in uses the PKCE flow. On web the browser is
    // redirected back with ?code=..., which Supabase exchanges
    // automatically; native exchanges it in AuthContext.
    flowType: 'pkce',
    detectSessionInUrl: Platform.OS === 'web',
  },
});