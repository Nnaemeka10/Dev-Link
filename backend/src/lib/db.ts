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
        const migrationsDir = path.join(__dirname, 'migrations');

        if( !fs.existsSync(migrationsDir) ) {
            console.log('No migration files found, skipping....');
            return;
        }
            
        //create migrations tracking table if it doesnt exist
        await pool.query(`
                CREATE TABLE IF NOT EXISTS schema_migrations(
                    id SERIAL PRIMARY KEY,
                    filename TEXT UNIQUE NOT NULL,
                    executed_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);

        //read all migration files
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); //sorts alphabetically

        if (files.length === 0) {
            console.log('No migration files found, skipping....');
            return;
        }

        console.log(`Found ${files.length} migration file(s)`);

        //run each migratiion file
        for( const file of files) {
            //check if migrations have already beeen run
            const checkResult = await pool.query(
                `SELECT filename FROM schema_migrations WHERE filename = $1`,
                [file]
            );

            if (checkResult.rows.length > 0) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            // Read and execute migration
            const migrationPath = path.join(migrationsDir, file);
            const migration = fs.readFileSync(migrationPath, 'utf-8');

            console.log(`🔄 Running migration: ${file}`);
            
            // Execute migration in a transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(migration);
                
                // Record successful migration
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                
                await client.query('COMMIT');
                console.log(`✅ Successfully executed: ${file}`);
            } catch (error: any) {
                await client.query('ROLLBACK');
                console.error(`❌ Error executing ${file}:`, error.message);
                throw error; // Stop migration process on error
            } finally {
                client.release();
            }
        }

        console.log('✅ All migrations completed successfully');

    } catch (error:any) {
        console.log(`Migration error: ${error.message}`);
        //dont exit the process if migration fails incase tables already exist
        // But you might want to exit in production
        // process.exit(1);
        
    }
}

// export the pool getter
export const getDB = () => {
    if (!pool) throw new Error('Database pool is not initialized');
    return pool;
}