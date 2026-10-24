import pg from 'pg';

const host = `aws-0-ap-south-1.pooler.supabase.com`;
const port = 6543;
const user = `postgres.nciqqkrnrdtuzwskjyqn`;
const password = process.env.SUPABASE_DB_PASSWORD || '';
const database = 'postgres';

async function testConnection() {
  console.log(`Connecting to ${host}:${port} as ${user}...`);
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[SUCCESS] Connected to Supabase PostgreSQL!');
    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log('Result:', res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.error('[ERROR] Failed to connect:', err.message);
  }
}

testConnection();
