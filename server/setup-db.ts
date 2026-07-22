import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const schemaSQL = `
-- Drop existing tables to ensure a clean database setup
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS global_components CASCADE;
DROP TABLE IF EXISTS trash CASCADE;
DROP TABLE IF EXISTS versions CASCADE;

-- 1. Proposals Table
CREATE TABLE proposals (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  client_name TEXT,
  company_name TEXT,
  date TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'draft',
  brand_kit JSONB NOT NULL DEFAULT '{}'::jsonb,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  signatures JSONB NOT NULL DEFAULT '{}'::jsonb,
  reusable_library JSONB NOT NULL DEFAULT '[]'::jsonb,
  parent_id TEXT,
  industry TEXT,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_branch TEXT DEFAULT 'main',
  branches JSONB NOT NULL DEFAULT '{}'::jsonb,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_blueprint BOOLEAN DEFAULT FALSE,
  blueprint_description TEXT,
  is_pinned_default BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Version History Table
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_kit JSONB NOT NULL DEFAULT '{}'::jsonb,
  signatures JSONB NOT NULL DEFAULT '{}'::jsonb,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_versions_proposal_id ON versions(proposal_id);

-- 3. Global Components / Reusable Blocks
CREATE TABLE global_components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  layout TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  list_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Settings Table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  default_master_proposal_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Trash Table
CREATE TABLE trash (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'proposal' | 'master'
  deleted_at TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Seed Initial Default Settings Row
INSERT INTO settings (id, default_master_proposal_id)
VALUES ('default', NULL)
ON CONFLICT (id) DO NOTHING;
`;

async function main() {
  console.log('Connecting to Supabase PostgreSQL Database...');
  try {
    await client.connect();
    console.log('Connected successfully!');
    console.log('Deploying schema migrations...');
    await client.query(schemaSQL);
    console.log('Database tables created and seeded successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
