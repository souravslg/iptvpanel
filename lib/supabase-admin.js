
import { createClient } from '@supabase/supabase-js';

// process.env.SUPABASE_URL should be available if using Next.js .env support, active in `npm run dev`
// If not, we can fallback to the hardcoded URL from lib/supabase.js, but Key MUST be from env or hardcoded (not recommended for repo but okay for this user's local setup if they insist).
// For now, I will assume the user has set the env vars conformant to best practices or I will use the hardcoded URL I saw earlier and expect the key to be in env.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
