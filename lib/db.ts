import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function initializeDatabase() {
  try {
    // Check if tables exist
    const { data: tables, error } = await supabaseAdmin.rpc('get_tables');
    
    if (error && !error.message.includes('does not exist')) {
      console.error('[v0] Error checking tables:', error);
      throw error;
    }

    console.log('[v0] Database initialization check complete');
  } catch (error) {
    console.error('[v0] Database initialization failed:', error);
    throw error;
  }
}
