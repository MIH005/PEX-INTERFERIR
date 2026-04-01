const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTrigger() {
  // Find a plan
  const { data: plans, error: pError } = await supabase.from('action_plans').select('*').limit(1);
  if (pError || !plans || plans.length === 0) {
    console.log('No plans found or error:', pError);
    return;
  }
  const plan = plans[0];
  console.log('Original status:', plan.status);

  // Insert update
  const { data: update, error: uError } = await supabase.from('action_updates').insert({
    action_plan_id: plan.id,
    comment: 'Test trigger',
    status_changed_to: 'Concluído'
  }).select();

  if (uError) {
    console.log('Insert error:', uError);
    return;
  }
  console.log('Inserted update:', update);

  // Check plan again
  const { data: planAfter, error: pError2 } = await supabase.from('action_plans').select('*').eq('id', plan.id).single();
  console.log('New status:', planAfter.status);
}

testTrigger();
