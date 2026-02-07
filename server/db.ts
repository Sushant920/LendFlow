
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (server runs from server/)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key. Check .env file.');
    console.error('URL:', supabaseUrl);
    console.error('Keys present:', !!supabaseKey);
}

// Use lazy initialization for Supabase to prevent boot crashes
let supabaseInstance: any = null;

const getSupabase = () => {
    if (!supabaseInstance) {
        if (!supabaseUrl || !supabaseKey) {
            console.error("Supabase URL/Key missing. Check Vercel Env Vars.");
            throw new Error("Supabase credentials not configured");
        }
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
};

// Export a proxy object that mimics the Supabase client but initializes lazily
export const supabase = {
    from: (table: string) => getSupabase().from(table),
    auth: {
        getUser: (token: string) => getSupabase().auth.getUser(token),
        // Add other auth methods as needed or expose the raw client via a getter
    }
} as any; // Cast to any to avoid complex type mocking, or use ReturnType<typeof createClient>

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
    end: () => getPool().end(),
};
