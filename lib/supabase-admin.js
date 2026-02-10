
import { createClient } from '@supabase/supabase-js';

// process.env.SUPABASE_URL should be available if using Next.js .env support, active in `npm run dev`
// If not, we can fallback to the hardcoded URL from lib/supabase.js, but Key MUST be from env or hardcoded (not recommended for repo but okay for this user's local setup if they insist).
// For now, I will assume the user has set the env vars conformant to best practices or I will use the hardcoded URL I saw earlier and expect the key to be in env.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key. Some admin operations may fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
