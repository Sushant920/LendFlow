
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key. Check .env file.');
    console.error('URL:', supabaseUrl);
    console.error('Keys present:', !!supabaseKey);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

import { Pool } from 'pg';
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
