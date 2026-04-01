import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNonExistentColumn() {
  const { data, error } = await supabase
    .from('action_plans')
    .select('this_column_does_not_exist')
    .limit(1);
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success:', data);
  }
}

testNonExistentColumn();
