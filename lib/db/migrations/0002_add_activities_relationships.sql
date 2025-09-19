-- Migration: Add activities and relationships tables for enhanced CRM functionality
-- This adds support for activity timeline and advanced entity relationships

-- Activities table for timeline tracking
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID, -- User who performed the activity
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- email_sent, call_made, meeting_held, note_added, etc.
    source_module VARCHAR(50), -- evermail, everchat, evercore, evercal, etc.
    content JSONB DEFAULT '{}', -- Activity details
    participants UUID[], -- Array of user IDs involved
    metadata JSONB DEFAULT '{}', -- Additional metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships table for advanced entity linking
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    source_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- parent_company, subsidiary, partner, competitor, etc.
    strength_score INTEGER DEFAULT 50 CHECK (strength_score >= 0 AND strength_score <= 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

CREATE INDEX IF NOT EXISTS idx_relationships_workspace ON relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Add unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationships_unique 
ON relationships(workspace_id, source_entity_id, target_entity_id, relationship_type);

-- Add trigger to update relationships.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_relationships_updated_at 
    BEFORE UPDATE ON relationships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();