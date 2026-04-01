const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    console.log('RPC error:', error.message);
    // Try querying pg_policies
    const { data: policies, error: pError } = await supabase.from('pg_policies').select('*');
    if (pError) console.log('pg_policies error:', pError.message);
    else console.log('Policies:', policies);
  } else {
    console.log('Policies:', data);
  }
}

check();
