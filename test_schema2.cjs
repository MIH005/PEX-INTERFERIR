require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: updates } = await supabase.from('action_updates').select('*').limit(1);
  const { data: evidences } = await supabase.from('evidences').select('*').limit(1);
  console.log('Updates:', updates);
  console.log('Evidences:', evidences);
}

check();
