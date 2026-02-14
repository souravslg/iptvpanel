-- Create shared_links table for managing shareable M3U URLs with expiry
CREATE TABLE IF NOT EXISTS shared_links (
    id SERIAL PRIMARY KEY,
    link_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    expire_date TIMESTAMP,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_by INTEGER REFERENCES admin(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

-- Create index on link_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_links_link_id ON shared_links(link_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_shared_links_status ON shared_links(status);
