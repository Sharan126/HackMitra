import { createAdminSupabaseClient } from '../src/lib/supabase/admin';

async function main() {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    console.error('Failed to create admin client');
    process.exit(1);
  }

  const { data: hackathons, error: e0 } = await supabase.from('hackathons').select('id, title, registration_deadline, current_status').limit(5);
  console.log('hackathons query:', { count: hackathons?.length, error: e0?.message, sample: hackathons?.[0] });

  const { data: se, error: e1 } = await supabase.from('saved_events').select('*').limit(1);
  console.log('saved_events query:', { count: se?.length, error: e1?.message });

  const { data: up, error: e2 } = await supabase.from('user_preferences').select('*').limit(1);
  console.log('user_preferences query:', { count: up?.length, error: e2?.message });

  const { data: ns, error: e3 } = await supabase.from('notification_subscriptions').select('*').limit(1);
  console.log('notification_subscriptions query:', { count: ns?.length, error: e3?.message });
}

main().catch(console.error);
