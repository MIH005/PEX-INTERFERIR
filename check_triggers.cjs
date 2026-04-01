const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTriggers() {
  const { data, error } = await supabase.from('pg_trigger').select('*');
  console.log(error ? error.message : data);
}

checkTriggers();
