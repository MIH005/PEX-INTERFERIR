import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { error: insertError } = await supabase
    .from('action_plans')
    .insert([{ checklist_type: '123' }])
    .select();
  console.log('Insert error checklist_type:', insertError);
}

checkColumns();
