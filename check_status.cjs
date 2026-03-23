const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const statuses = ['Pendente', 'Em andamento', 'Concluído', 'Cancelado', 'pendente', 'em andamento', 'concluído', 'cancelado', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
  for (const status of statuses) {
    const { data, error } = await supabase.from('action_plans').insert({ status }).select();
    console.log(`Status: ${status}`, error ? error.message : 'Success');
  }
}

check();
