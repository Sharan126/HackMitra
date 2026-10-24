import fs from 'fs';
import path from 'path';
import pg from 'pg';

async function runMigration() {
  const host = `aws-0-ap-south-1.pooler.supabase.com`;
  const port = 6543;
  const user = `postgres.nciqqkrnrdtuzwskjyqn`;
  const password = process.env.SUPABASE_DB_PASSWORD || '';
  const database = 'postgres';

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
    console.log('Connected to Supabase PostgreSQL cluster.');

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '006_user_accounts_and_notifications.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing Migration 006...');
    await client.query(sql);
    console.log('✅ Migration 006 applied successfully!');

    // Verify tables
    const checkLogs = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('notification_delivery_logs', 'scheduled_reminders');`);
    console.log('Verified tables:', checkLogs.rows.map(r => r.table_name));

    await client.end();
  } catch (err: any) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
