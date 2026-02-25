import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Missing Supabase environment variables. Check .env.local or GitHub Secrets.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey || ''
);
