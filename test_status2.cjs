const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // 1. Sign up a new user
  const email = `admin_${Date.now()}@gruporihappy.com.br`;
  const password = 'testpassword123';
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  
  const userId = authData.user?.id;
  console.log('Signed up user:', userId);
  
  // 2. Insert into users table as admin
  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    name: 'Test Admin',
    role: 'admin'
  });
  
  if (userError) {
    console.error('Error inserting into users:', userError.message);
    // Might fail if RLS prevents inserting into users, but let's see
  } else {
    console.log('Inserted into users as admin');
  }
  
  // 3. Try to insert an action plan with different statuses
  const statusesToTry = [
    'Pendente', 'Em andamento', 'Em Andamento', 'em andamento', 'EM ANDAMENTO',
    'Concluído', 'Concluido', 'concluído', 'Cancelado', 'cancelado',
    'Pending', 'In Progress', 'Completed', 'Cancelled',
    'Aberto', 'Fechado', 'Em Progresso'
  ];
  
  for (const status of statusesToTry) {
    const { data, error } = await supabase.from('action_plans').insert({
      store_id: '00000000-0000-0000-0000-000000000000', // dummy
      description_problem: 'test',
      action_plan: 'test',
      due_date: new Date().toISOString(),
      status: status
    }).select();
    
    if (error) {
      console.log(`Status '${status}':`, error.message);
    } else {
      console.log(`Status '${status}': SUCCESS!`);
    }
  }
}

test();
