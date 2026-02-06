
import { pool } from '../db';

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'application_decisions'
        `);
        console.log('Columns in application_decisions:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
