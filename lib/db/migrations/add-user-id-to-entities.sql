-- Add userId column to entities table for user-level data isolation
ALTER TABLE entities ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_entities_user ON entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_workspace_user ON entities(workspace_id, user_id);

-- Update existing entities to associate with correct users where possible
-- This will need to be run after users are synced from Clerk