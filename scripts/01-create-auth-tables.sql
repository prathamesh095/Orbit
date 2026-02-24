-- Create auth schema for secure authentication system
-- This migration sets up the core tables for user authentication, session management, and audit logging

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
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

-- Create indexes on users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Create sessions table
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

-- Create indexes on sessions table
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);

-- Create auth_logs table for audit trail
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

-- Create indexes on auth_logs table
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX idx_auth_logs_ip_address ON auth_logs(ip_address);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Service role can read all users"
  ON users FOR SELECT
  USING (auth.role() = 'service_role');

-- Create RLS policies for sessions table
CREATE POLICY "Users can read their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Create RLS policies for auth_logs table
CREATE POLICY "Users can read their own audit logs"
  ON auth_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert and read all logs"
  ON auth_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sessions_updated_at_trigger
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON users TO anon, authenticated;
GRANT SELECT ON sessions TO anon, authenticated;
GRANT SELECT ON auth_logs TO authenticated;

GRANT ALL ON users TO service_role;
GRANT ALL ON sessions TO service_role;
GRANT ALL ON auth_logs TO service_role;

-- Create comment documentation
COMMENT ON TABLE users IS 'Stores user account information with secure password hashing';
COMMENT ON TABLE sessions IS 'Manages active user sessions with token-based authentication';
COMMENT ON TABLE auth_logs IS 'Audit trail for all authentication events';
