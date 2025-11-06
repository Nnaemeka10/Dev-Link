import { Pool } from 'pg';
import { ENV } from '../lib/env.js';

const userSchema = new Pool({
    connectionString: ENV.POSTGRES_URI,
});

