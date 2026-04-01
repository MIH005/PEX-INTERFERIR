require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

async function fetchOpenAPI() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const json = await res.json();
  console.log('Keys:', Object.keys(json));
  if (json.definitions) console.log('Definitions:', Object.keys(json.definitions));
  if (json.components && json.components.schemas) console.log('Schemas:', Object.keys(json.components.schemas));
  if (json.definitions && json.definitions.action_plans) console.log('Action Plans:', Object.keys(json.definitions.action_plans.properties));
}

fetchOpenAPI();
