import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dctkcykhossyqxutxrwz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdGtjeWtob3NzeXF4dXR4cnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjAzOTEsImV4cCI6MjA4ODYzNjM5MX0.LH__KzCmV5oH3dE8bkJWt5aKzqpdwTfbM3IyOwyJLz8';

const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseAnonKey || supabaseAnonKey.includes('placeholder');

if (isPlaceholder) {
  console.warn('Supabase configuration is missing or using placeholders. Database operations will fail.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-application-name': 'dr-noe-santiago' },
    },
  }
);
