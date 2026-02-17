
import { createClient } from '@supabase/supabase-js';

// Credenciais hardcoded para garantir funcionamento imediato em produção
const supabaseUrl = 'https://sbozssdnqccvflfuxqnj.supabase.co';
const supabaseAnonKey = 'sb_publishable_Umku-rbOaAJBgHRSJ4Cp3g_mKU9Ykwn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
