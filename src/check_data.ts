import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('action_plans')
    .select('id, description_problem, action_plan, checklist_type')
    .limit(5);
  console.log('Data:', data);
  console.log('Error:', error);
}

checkData();
