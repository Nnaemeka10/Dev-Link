import { Pool } from 'pg';
import { ENV } from './env.js';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;

export const connectDB = async () => {
    try {
        const { POSTGRES_URI } = ENV;
        if (!POSTGRES_URI) throw new Error('POSTGRES_URI is not defined in environment variables');

        pool  = new Pool({
            connectionString: POSTGRES_URI,
        });

        // test connection
        const conn = await pool.connect();
        console.log(`PostgreSQL database connected`);
        conn.release();

        //run migrations
        await runMigrations();
        return pool;

    } catch (error: any) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

//function to run migrations
async function runMigrations() {
    if (!pool) throw new Error('Database pool is not initialized');

    try {
        const __dirname = path.resolve();
        const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');

        if( fs.existsSync(migrationPath) ) {
            const migration = fs.readFileSync(migrationPath, 'utf-8');
            await pool.query(migration);
            console.log('Database migrations ran successfully');
        } else {
            console.log('No migration files found, skipping....');
        }
    } catch (error:any) {
        console.log(`Migration error: ${error.message}`);
        //dont exit the process if migration fails incase tables already exist
    }
}

// export the pool getter
export const getDB = () => {
    if (!pool) throw new Error('Database pool is not initialized');
    return pool;
}