import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://asavvjcvjtxzghsrmhct.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYXZ2amN2anR4emdoc3JtaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzg5ODgsImV4cCI6MjA2NzcxNDk4OH0.uJtys8o_HGu33Yzre2tj3QaVgEOlJ2HA9p_8vEZ1acM ';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
