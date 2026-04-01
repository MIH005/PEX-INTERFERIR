import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  console.log('Adding columns to action_plans...');
  
  // We can't directly alter table via supabase-js standard API.
  // We need to use the REST API or a stored procedure if available,
  // or we can just try to insert a dummy row to see if the columns exist.
  
  const { data, error } = await supabase
    .from('action_plans')
    .select('checklist_type, external_evaluation_id')
    .limit(1);
    
  if (error) {
    console.error('Error checking columns:', error.message);
  } else {
    console.log('Columns exist!');
  }
}

addColumns();
