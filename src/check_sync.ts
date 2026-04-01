import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSync() {
  const { data, error } = await supabase
    .from('sync_control')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error checking sync_control:', error.message);
  } else {
    console.log('Sync control:', JSON.stringify(data, null, 2));
  }
}

checkSync();
