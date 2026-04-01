require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: plans } = await supabase.from('action_plans').select('*').limit(1);
  const { data: updates } = await supabase.from('action_updates').select('*').limit(1);
  const { data: evidences } = await supabase.from('evidences').select('*').limit(1);
  
  console.log('Action Plans Schema:', plans && plans.length > 0 ? Object.keys(plans[0]) : 'No data');
  console.log('Action Updates Schema:', updates && updates.length > 0 ? Object.keys(updates[0]) : 'No data');
  console.log('Evidences Schema:', evidences && evidences.length > 0 ? Object.keys(evidences[0]) : 'No data');
}

checkSchema();
