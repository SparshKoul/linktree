import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in environment. ' +
      'The database will not work until they are set.'
  );
}

// The client is made even when the environment is not there, so that a fresh
// copy of the project can still run its tests. Every request to the database
// will fail with a clear message until the keys are filled in.
export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseKey || 'missing-supabase-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
