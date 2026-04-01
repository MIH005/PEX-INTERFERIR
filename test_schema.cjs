const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

check();
