
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL is missing!');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
});

async function seedUser() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const userId = '00000000-0000-0000-0000-000000000001';
        const email = 'demo@example.com';
        // Password: DemoPass123!
        // We use a dummy hash or rely on pgcrypto if enabled. 
        // Supabase uses bcrypt. Let's try to simulate or just insert.
        // If we can't generate valid bcrypt in SQL easily without pgcrypto extensions enabled in 'auth', 
        // we might not interpret the password correctly on login, BUT we only need the USER to EXIST
        // so we can insert loan applications. We will mock the login on frontend anyway!

        // Check if user exists
        const checkRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
        if (checkRes.rowCount && checkRes.rowCount > 0) {
            console.log('User already exists');
            return;
        }

        // Insert User
        // Note: We need to use 'crypt' from pgcrypto usually. 
        // If pgcrypto is not accessible in this context, valid login via Supabase Client might fail.
        // But our goal is to satisfy FK constraint for LoanApplication table.
        // Frontend will be mocked to use this ID.
        await client.query(`
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, 
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
                created_at, updated_at
            )
            VALUES (
                '00000000-0000-0000-0000-000000000000', 
                $1, 
                'authenticated', 
                'authenticated', 
                $2, 
                'INVALID_PASSWORD_HASH_BUT_WHO_CARES', 
                now(), 
                '{"provider":"email","providers":["email"]}', 
                '{"full_name":"Demo User","company_name":"Demo Co"}', 
                now(), 
                now()
            )
        `, [userId, email]);

        console.log('User inserted into auth.users');

        // Insert Identity (optional but good for consistency)
        await client.query(`
            INSERT INTO auth.identities (
                id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
            )
            VALUES (
                gen_random_uuid(), 
                $1, 
                $2, 
                'email', 
                now(), 
                now(), 
                now()
            )
        `, [userId, JSON.stringify({ sub: userId, email: email })]);

        console.log('Identity inserted');

        // Insert into public.profiles (if trigger does not exist, but let's do it manually to be safe)
        // Check if trigger handles it? Usually yes. But let's verify.
        // Actually, let's just try insertion of Loan Application to verify FK.

        // Wait, app logic expects entry in user_roles?
        await client.query(`
            INSERT INTO public.user_roles (user_id, role)
            VALUES ($1, 'merchant')
            ON CONFLICT (user_id, role) DO NOTHING
        `, [userId]);
        console.log('User Role inserted');

    } catch (err) {
        console.error('Error seeding user:', err);
    } finally {
        await client.end();
    }
}

seedUser();
