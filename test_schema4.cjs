require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_info', { table_name: 'action_plans' });
  if (error) {
    // Fallback: Just try to insert a dummy row and catch the error to see columns, or use a REST endpoint
    const res = await fetch(`${supabaseUrl}/rest/v1/action_plans?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const json = await res.json();
    console.log('Action Plans REST:', json);
  } else {
    console.log('Schema:', data);
  }
}

checkSchema();
