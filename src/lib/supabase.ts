import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xihxzcijdhgmlhvtnowe.supabase.co';
const supabaseKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaHh6Y2lqZGhnbWxodnRub3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODIxNzMsImV4cCI6MjA2ODY1ODE3M30.Nu4pPfxMYRrhgc97HTzZ8V7KeaazawidYRszjMdFizw';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
