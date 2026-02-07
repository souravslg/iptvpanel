
-- Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    max_connections INTEGER DEFAULT 1,
    expire_date TIMESTAMP,
    status TEXT DEFAULT 'Active',
    package TEXT DEFAULT 'Full Package',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Streams Table
CREATE TABLE IF NOT EXISTS streams (
    id SERIAL PRIMARY KEY,
    stream_id TEXT UNIQUE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT,
    category TEXT,
    type TEXT DEFAULT 'live',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Seed Admin (Password: Siliguri1)
INSERT INTO admin (email, password)
VALUES ('srviptvindia@gmail.com', '$2b$10$sXqXgw8I/YjesGO9mjT9KuyPbqF.gH7.Hk/pkwqQdE.g6.1.W6.y6')
ON CONFLICT (email) DO NOTHING;
