import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { error: insertError } = await supabase
    .from('action_plans')
    .insert([{ external_evaluation_id: '123' }])
    .select();
  console.log('Insert error external_evaluation_id:', insertError);
}

checkColumns();
