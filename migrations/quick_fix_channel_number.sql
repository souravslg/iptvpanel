-- Quick fix: Add channel_number column if it doesn't exist
-- Run this in Supabase SQL Editor

-- Add channel_number column
ALTER TABLE streams ADD COLUMN IF NOT EXISTS channel_number INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_streams_channel_number ON streams(channel_number);

-- Optional: Set some default channel numbers based on current order
-- UPDATE streams SET channel_number = id WHERE channel_number IS NULL;
