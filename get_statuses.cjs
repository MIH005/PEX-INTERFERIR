const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('action_plans').select('status');
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const statuses = new Set(data.map(d => d.status));
  console.log('Distinct statuses in DB:', Array.from(statuses));
}

check();
