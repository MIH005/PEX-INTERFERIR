const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  // We can't query information_schema directly from the client API usually, but maybe we can query a function or we can just try to insert different values and see which one succeeds without violating the check constraint.
  // Wait, if RLS is enabled, we can't insert.
  // Can we select from the table?
  const { data, error } = await supabase.from('action_plans').select('status').limit(100);
  console.log('Data:', data);
  console.log('Error:', error);
}

check();
