const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  const { data, error } = await supabase.from('users').select('*');
  console.log(data, error);
}

checkUser();
