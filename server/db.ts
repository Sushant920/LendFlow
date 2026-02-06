
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

// Use lazy initialization to prevent crashes if env vars are missing during build/boot
let poolInstance: Pool | null = null;

export const getPool = () => {
    if (!poolInstance) {
        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is missing!");
            throw new Error("DATABASE_URL is not configured");
        }
        poolInstance = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }
    return poolInstance;
};

// Backwards compatibility helper (deprecated, use getPool)
export const pool = {
    query: (text: string, params?: any[]) => getPool().query(text, params),
};
