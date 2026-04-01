import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Sample data:', JSON.stringify(data, null, 2));
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('No data found, trying to get schema info via RPC or just inserting a dummy row and rolling back');
    }
  }
}

checkColumns();
