// syncBanks.ts
import { connectDB, getDB } from './src/lib/db.js';
import { ENV } from './src/lib/env.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function syncBanks() {
  // 1. Initialize the database connection first!
  await connectDB();
  
  console.log('Fetching banks from Paystack...');
  // FIX: Paystack expects lowercase 'ng' and we add perPage=100 to get all banks
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&enabled_for_verification=true&perPage=100`, {
    headers: { Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  
  if (!data.status) throw new Error('Failed to fetch banks from Paystack');

  const db = getDB();
  console.log(`Found ${data.data.length} banks. Upserting into database...`);

  for (const bank of data.data) {
    await db.query(
      `INSERT INTO bank_directory (name, code, country) 
       VALUES ($1, $2, 'NG') 
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [bank.name, bank.code]
    );
  }
  console.log('✅ Bank directory synced successfully!');
  process.exit(0);
}

syncBanks().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});