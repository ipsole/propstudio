import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_ANON_KEY is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing Supabase REST API connection...');
  try {
    const { data, error } = await supabase.from('proposals').select('*').limit(1);
    if (error) {
      console.log('API responded with error (this is expected if tables are not created yet):', error.message);
    } else {
      console.log('API responded successfully! Data:', data);
    }
  } catch (err: any) {
    console.error('Failed to query Supabase API:', err.message);
  }
}

main();
