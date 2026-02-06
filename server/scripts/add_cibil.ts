
import { pool } from '../db';

async function addColumn() {
    try {
        await pool.query(`
            ALTER TABLE public.loan_applications 
            ADD COLUMN IF NOT EXISTS founder_cibil_score INTEGER;
        `);
        console.log('Added founder_cibil_score column');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

addColumn();
