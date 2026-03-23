const https = require('https');

const url = 'https://aswnahmjgxfwnlbegbhh.supabase.co/graphql/v1';
const apiKey = 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

const data = JSON.stringify({
  query: `
    query {
      __schema {
        types {
          name
          kind
          description
          enumValues {
            name
          }
        }
      }
    }
  `
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': apiKey,
    'Content-Length': data.length
  }
};

const req = https.request(url, options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    const parsed = JSON.parse(responseData);
    if (parsed.data && parsed.data.__schema) {
      const types = parsed.data.__schema.types;
      const enums = types.filter(t => t.kind === 'ENUM');
      console.log('Enums:', JSON.stringify(enums, null, 2));
    } else {
      console.log('Response:', responseData);
    }
  });
});

req.on('error', (err) => {
  console.log('Error:', err.message);
});

req.write(data);
req.end();
