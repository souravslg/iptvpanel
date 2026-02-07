-- Add DRM and MPD support fields to streams table

-- Add new columns for DRM support
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_scheme TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_license_url TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_key_id TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_key TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS stream_format TEXT DEFAULT 'hls';
ALTER TABLE streams ADD COLUMN IF NOT EXISTS headers JSONB;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS channel_number INTEGER;

-- Update existing records to have default stream_format
UPDATE streams SET stream_format = 'hls' WHERE stream_format IS NULL;

-- Create index for channel_number for better sorting performance
CREATE INDEX IF NOT EXISTS idx_streams_channel_number ON streams(channel_number);

COMMENT ON COLUMN streams.drm_scheme IS 'DRM scheme: widevine, playready, fairplay, clearkey';
COMMENT ON COLUMN streams.drm_license_url IS 'DRM license server URL';
COMMENT ON COLUMN streams.drm_key_id IS 'DRM key ID for ClearKey';
COMMENT ON COLUMN streams.drm_key IS 'DRM key for ClearKey';
COMMENT ON COLUMN streams.stream_format IS 'Stream format: hls, mpd, rtmp, ts';
COMMENT ON COLUMN streams.headers IS 'Custom HTTP headers as JSON object';
COMMENT ON COLUMN streams.channel_number IS 'Custom channel number for ordering';
