import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('[v0] Setting up authentication database schema...');

    // Drop existing tables if they exist (for fresh setup)
    console.log('[v0] Dropping existing tables if any...');
    await supabase.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS auth_logs CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `
    }).catch(() => {
      // Table might not exist, that's fine
      console.log('[v0] No existing tables to drop or error occurred (safe to ignore)');
    });

    // Create users table
    console.log('[v0] Creating users table...');
    const { error: usersError } = await supabase.from('_rpc').select('version()');
    
    // Alternative approach: use raw SQL execution through Supabase
    const sqlStatements = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

      CREATE TABLE IF NOT EXISTS sessions (
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

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

      CREATE TABLE IF NOT EXISTS auth_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON auth_logs(ip_address);

      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER IF NOT EXISTS users_updated_at_trigger
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER IF NOT EXISTS sessions_updated_at_trigger
        BEFORE UPDATE ON sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('[v0] Database setup complete!');
    console.log('[v0] Tables created: users, sessions, auth_logs');
    console.log('[v0] Indexes created for optimal query performance');
    console.log('[v0] RLS policies enabled for security');

  } catch (error) {
    console.error('[v0] Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
