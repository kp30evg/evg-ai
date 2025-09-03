-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Drop existing tables (backup first in production!)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;

-- Create the ONE unified entities table
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  relationships JSONB[] DEFAULT ARRAY[]::JSONB[],
  metadata JSONB,
  search_vector tsvector,
  embedding vector(1536),
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_entities_company_id ON entities(company_id);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_company_type ON entities(company_id, type);
CREATE INDEX idx_entities_created_at ON entities(created_at);
CREATE INDEX idx_entities_data_gin ON entities USING gin(data);
CREATE INDEX idx_entities_relationships_gin ON entities USING gin(relationships);
CREATE INDEX idx_entities_search_vector ON entities USING gin(search_vector);

-- Create function to auto-update search_vector
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.data->>'content', '') || ' ' ||
    COALESCE(NEW.data->>'title', '') || ' ' ||
    COALESCE(NEW.data->>'subject', '') || ' ' ||
    COALESCE(NEW.data->>'body', '') || ' ' ||
    COALESCE(NEW.data->>'name', '') || ' ' ||
    COALESCE(NEW.data->>'description', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
CREATE TRIGGER update_entities_search_vector
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Migrate existing organizations table (keep as-is for now)
-- Organizations will eventually become entities too, but we'll keep them separate for auth

-- Sample data migration (if you have existing data)
-- This would convert existing tables to entities:

-- Example: Migrate conversations
-- INSERT INTO entities (company_id, type, data, created_by, created_at)
-- SELECT 
--   organization_id as company_id,
--   'conversation' as type,
--   jsonb_build_object(
--     'title', title,
--     'status', 'active',
--     'messageCount', 0
--   ) as data,
--   user_id as created_by,
--   created_at
-- FROM conversations;

-- Example: Migrate messages  
-- INSERT INTO entities (company_id, type, data, created_by, created_at)
-- SELECT
--   c.organization_id as company_id,
--   'message' as type,
--   jsonb_build_object(
--     'content', m.content,
--     'role', m.role,
--     'conversationId', m.conversation_id
--   ) as data,
--   c.user_id as created_by,
--   m.created_at
-- FROM messages m
-- JOIN conversations c ON m.conversation_id = c.id;