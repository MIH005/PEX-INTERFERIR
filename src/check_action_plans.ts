import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActionPlans() {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error('Error checking action_plans:', error.message);
  } else {
    console.log('Action plans:', JSON.stringify(data, null, 2));
  }
}

checkActionPlans();
