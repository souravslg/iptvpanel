'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Play, ArrowLeft, Settings, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function PlayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);

    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [player, setPlayer] = useState(null);

    const channelId = searchParams.get('id');

    useEffect(() => {
        if (channelId) {
            fetchChannel();
        }
    }, [channelId]);

    useEffect(() => {
        // Load Shaka Player script
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.7.0/shaka-player.compiled.js';
        script.async = true;
        script.onload = () => {
            console.log('Shaka Player loaded');
            if (channel) {
                initializePlayer();
            }
        };
        document.body.appendChild(script);

        return () => {
            if (player) {
                player.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (channel) {
            initializePlayer();
        }
    }, [channel]);

    const fetchChannel = async () => {
        try {
            const res = await fetch(`/api/playlist/channel?id=${channelId}`);
            const data = await res.json();

            if (res.ok && data.channel) {
                setChannel(data.channel);
            } else {
                setError('Channel not found');
            }
        } catch (err) {
            setError('Failed to load channel');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initializePlayer = async () => {
        if (!videoRef.current || !channel) return;

        try {
            console.log('Initializing player for channel:', channel.name);
            console.log('Stream URL:', channel.url);
            console.log('Stream format:', channel.stream_format);

            const streamUrl = channel.url;

            // For HLS streams, use native HTML5 video player (most reliable)
            if (channel.stream_format === 'hls' || streamUrl.includes('.m3u8')) {
                console.log('Using native HTML5 player for HLS');

                // Set crossorigin for CORS
                videoRef.current.crossOrigin = 'anonymous';
                videoRef.current.src = streamUrl;

                // Add error handler
                videoRef.current.onerror = (e) => {
                    console.error('Native player error:', e);
                    console.error('Video error code:', videoRef.current.error?.code);
                    console.error('Video error message:', videoRef.current.error?.message);

                    let errorMessage = 'Failed to load stream';
                    if (videoRef.current.error) {
                        switch (videoRef.current.error.code) {
                            case 1:
                                errorMessage = 'Stream loading aborted';
                                break;
                            case 2:
                                errorMessage = 'Network error - Check if stream URL is accessible';
                                break;
                            case 3:
                                errorMessage = 'Stream decoding failed - Format may not be supported';
                                break;
                            case 4:
                                errorMessage = 'Stream format not supported by browser';
                                break;
                        }
                    }
                    setError(errorMessage + '. Stream URL: ' + streamUrl);
                };

                videoRef.current.onloadedmetadata = () => {
                    console.log('Stream metadata loaded successfully');
                };

                videoRef.current.oncanplay = () => {
                    console.log('Stream ready to play');
                };

                return;
            }

            // For DASH or DRM content, try Shaka Player
            if (window.shaka && (channel.stream_format === 'mpd' || streamUrl.includes('.mpd') ||
                (channel.drm_scheme && channel.drm_scheme !== 'none'))) {
                console.log('Using Shaka Player for DASH/DRM');

                if (!window.shaka.Player.isBrowserSupported()) {
                    console.warn('Browser not supported for Shaka Player');
                    setError('Browser does not support advanced playback features');
                    return;
                }

                // Destroy existing player if any
                if (player) {
                    await player.destroy();
                }

                const newPlayer = new window.shaka.Player(videoRef.current);

                // Configure DRM if needed
                if (channel.drm_scheme && channel.drm_scheme !== 'none') {
                    const drmConfig = {};

                    if (channel.drm_scheme === 'widevine' && channel.drm_license_url) {
                        drmConfig['com.widevine.alpha'] = {
                            'serverURL': channel.drm_license_url
                        };
                    } else if (channel.drm_scheme === 'playready' && channel.drm_license_url) {
                        drmConfig['com.microsoft.playready'] = {
                            'serverURL': channel.drm_license_url
                        };
                    } else if (channel.drm_scheme === 'clearkey' && channel.drm_key_id && channel.drm_key) {
                        // Convert hex keys to base64 for ClearKey
                        const hexToBase64 = (hexString) => {
                            const cleanHex = hexString.replace(/[\s-]/g, '');
                            const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                            let binary = '';
                            bytes.forEach(byte => binary += String.fromCharCode(byte));
                            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                        };

                        try {
                            const keyId = hexToBase64(channel.drm_key_id);
                            const key = hexToBase64(channel.drm_key);

                            console.log('ClearKey configuration:', {
                                originalKeyId: channel.drm_key_id,
                                originalKey: channel.drm_key,
                                base64KeyId: keyId,
                                base64Key: key
                            });

                            drmConfig['org.w3.clearkey'] = {
                                'clearKeys': {
                                    [keyId]: key
                                }
                            };
                        } catch (e) {
                            console.error('Error converting ClearKey hex to base64:', e);
                            // Fallback to original if conversion fails
                            drmConfig['org.w3.clearkey'] = {
                                'clearKeys': {
                                    [channel.drm_key_id]: channel.drm_key
                                }
                            };
                        }
                    }

                    newPlayer.configure({
                        drm: {
                            servers: drmConfig
                        }
                    });
                }

                // Error handling
                newPlayer.addEventListener('error', (event) => {
                    console.error('Shaka Player error:', event.detail);
                    setError('Playback error: ' + event.detail.message);
                });

                setPlayer(newPlayer);

                // Load the stream
                await newPlayer.load(streamUrl);
                console.log('Shaka Player loaded successfully');
                return;
            }

            // Fallback: try direct playback for other formats
            console.log('Using direct playback');
            videoRef.current.crossOrigin = 'anonymous';
            videoRef.current.src = streamUrl;

            videoRef.current.onerror = (e) => {
                console.error('Direct playback error:', e);
                setError('Failed to play stream. Format may not be supported.');
            };

            console.log('Player initialization complete');
        } catch (err) {
            console.error('Error initializing player:', err);
            setError('Failed to initialize player: ' + err.message);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (playing) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setPlaying(!playing);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !muted;
            setMuted(!muted);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setMuted(newVolume === 0);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading channel...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        marginBottom: '1rem'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#fee',
                    borderRadius: '0.5rem',
                    color: '#c00'
                }}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!channel) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Channel not found</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Playlist
                </button>

                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{channel.name}</h1>
                    {channel.category && (
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                            {channel.category}
                        </p>
                    )}
                </div>

                <div style={{ width: '120px' }} /> {/* Spacer for alignment */}
            </div>

            {/* Player Container */}
            <div
                ref={playerContainerRef}
                style={{
                    position: 'relative',
                    backgroundColor: '#000',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    aspectRatio: '16/9'
                }}
            >
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                    controls={true}
                    autoPlay
                    playsInline
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                />

                {/* Custom Controls Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                    >
                        <Play size={24} fill={playing ? 'white' : 'none'} />
                    </button>

                    {/* Volume */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={toggleMute}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '0.5rem'
                            }}
                        >
                            {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            style={{ width: '80px' }}
                        />
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </div>

            {/* Channel Info */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'var(--card)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Channel Information</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Stream Format</p>
                        <p style={{ fontWeight: 500 }}>{channel.stream_format?.toUpperCase() || 'HLS'}</p>
                    </div>

                    {channel.channel_number && (
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Channel Number</p>
                            <p style={{ fontWeight: 500 }}>{channel.channel_number}</p>
                        </div>
                    )}

                    {channel.drm_scheme && channel.drm_scheme !== 'none' && (
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>DRM Protection</p>
                            <p style={{ fontWeight: 500 }}>{channel.drm_scheme.charAt(0).toUpperCase() + channel.drm_scheme.slice(1)}</p>
                        </div>
                    )}

                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Stream URL</p>
                        <p style={{ fontWeight: 500, fontSize: '0.75rem', wordBreak: 'break-all' }}>{channel.url}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlayerPage() {
    return (
        <Suspense fallback={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading player...</p>
            </div>
        }>
            <PlayerContent />
        </Suspense>
    );
}
