const https = require('https');

const url = 'https://aswnahmjgxfwnlbegbhh.supabase.co/rest/v1/?apikey=sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const spec = JSON.parse(data);
    console.log(Object.keys(spec));
    if (spec.definitions) {
      console.log(Object.keys(spec.definitions));
      console.log(JSON.stringify(spec.definitions.action_plans, null, 2));
    } else if (spec.components && spec.components.schemas) {
      console.log(Object.keys(spec.components.schemas));
      console.log(JSON.stringify(spec.components.schemas.action_plans, null, 2));
    }
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
