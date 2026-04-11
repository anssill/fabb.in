
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local because dotenv is being tricky with paths
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: any = {};
envConfig.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);
  
  const { data, error } = await supabase.from('businesses').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('Error connecting to businesses table:', error.message);
    if (error.code === '42P01') {
      console.log('Result: The table "businesses" does not exist.');
    }
  } else {
    console.log('Connection successful!');
    console.log('Business count:', data);
  }

  const { data: staffData, error: staffError } = await supabase.from('staff').select('count', { count: 'exact', head: true });
  if (staffError) {
    console.error('Error connecting to staff table:', staffError.message);
  } else {
    console.log('Staff count:', staffData);
  }
}

testConnection();
