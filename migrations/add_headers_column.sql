-- Add headers column to streams table to support JTV/Xtream headers
ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT NULL; 
-- Or TEXT if you prefer, but JSONB is better for Supabase

-- If it already exists as TEXT, you might want to leave it or cast it. 
-- For safety, if it doesn't exist, we add it as JSONB.
