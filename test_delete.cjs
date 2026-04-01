const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDelete() {
  // We can't authenticate, but we can try to delete a plan without auth.
  // It will fail, but the error message might tell us if the policy exists.
  const { data, error } = await supabase.from('action_plans').delete().eq('id', '00000000-0000-0000-0000-000000000000').select();
  console.log(data, error);
}

testDelete();
