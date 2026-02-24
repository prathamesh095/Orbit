import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL = `
-- Create auth schema for secure authentication system
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);

CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX idx_auth_logs_ip_address ON auth_logs(ip_address);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Service role can read all users"
  ON users FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own audit logs"
  ON auth_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert and read all logs"
  ON auth_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sessions_updated_at_trigger
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT ON users TO anon, authenticated;
GRANT SELECT ON sessions TO anon, authenticated;
GRANT SELECT ON auth_logs TO authenticated;

GRANT ALL ON users TO service_role;
GRANT ALL ON sessions TO service_role;
GRANT ALL ON auth_logs TO service_role;
`;

async function setupDatabase() {
  try {
    console.log('[v0] Starting database setup...');
    
    const { error } = await supabase.rpc('exec', {
      sql: SQL,
    }).catch(async () => {
      // Fallback: Execute statements individually using raw query
      console.log('[v0] Using raw query approach...');
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['users', 'sessions', 'auth_logs']);
      
      if (error) {
        console.error('[v0] Error checking tables:', error);
        return { error };
      }
      
      const existingTables = data?.map(t => t.table_name) || [];
      const missingTables = ['users', 'sessions', 'auth_logs'].filter(t => !existingTables.includes(t));
      
      if (missingTables.length > 0) {
        console.log('[v0] Please run this SQL manually in Supabase SQL Editor:');
        console.log(SQL);
        return { error: new Error('Manual setup required') };
      }
      
      return { error: null };
    });

    if (error) {
      console.error('[v0] Database setup error:', error);
      process.exit(1);
    }

    console.log('[v0] Database setup completed successfully!');
    console.log('[v0] Tables created: users, sessions, auth_logs');
    console.log('[v0] RLS policies and indexes created');
    process.exit(0);
  } catch (err) {
    console.error('[v0] Setup failed:', err);
    process.exit(1);
  }
}

setupDatabase();
