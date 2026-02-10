'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function PlayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    const playerInstance = useRef(null); // Stores hls or dash instance
    const artRef = useRef(null);
    const artInstance = useRef(null);

    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [engine, setEngine] = useState(null); // 'hls', 'dash', 'native'

    const channelId = searchParams.get('id');

    useEffect(() => {
        if (channelId) {
            fetchChannel();
        }
    }, [channelId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            destroyPlayer();
        };
    }, []);

    const destroyPlayer = () => {
        if (playerInstance.current) {
            if (playerInstance.current.destroy) {
                playerInstance.current.destroy();
            } else if (playerInstance.current.reset) {
                playerInstance.current.reset();
            }
            playerInstance.current = null;
        }
    };

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

    // Load scripts helper
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    useEffect(() => {
        if (!channel || !artRef.current) return;

        const initPlayer = async () => {
            try {
                // Load dependencies
                await Promise.all([
                    loadScript('https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js'),
                    loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest'),
                    loadScript('https://cdn.dashjs.org/latest/dash.all.min.js')
                ]);

                if (artInstance.current) {
                    artInstance.current.destroy();
                }

                const streamUrl = channel.url;

                // Construct Path-Based Proxy URL
                let proxyUrl = '';
                try {
                    const urlObj = new URL(streamUrl);
                    const pathSegments = urlObj.pathname.split('/');
                    const fileName = pathSegments.pop();
                    const directory = pathSegments.join('/') + '/';
                    const baseUrl = urlObj.origin + directory;
                    const encodedBase = btoa(baseUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                    const query = urlObj.search;
                    proxyUrl = `/api/stream-proxy/${encodedBase}/${fileName}${query}`;
                } catch (e) {
                    console.error('Error constructing proxy URL:', e);
                    setError('Invalid Stream URL');
                    return;
                }

                const isDash = channel.stream_format === 'mpd' || streamUrl.includes('.mpd');
                const isHls = channel.stream_format === 'hls' || streamUrl.includes('.m3u8');
                const drmScheme = channel.drm_scheme?.toLowerCase();
                const hasDrm = drmScheme && drmScheme !== 'none';

                console.log(`Artplayer Init. Proxy: ${proxyUrl}`);

                const art = new window.Artplayer({
                    container: artRef.current,
                    url: proxyUrl,
                    type: isDash ? 'mpd' : 'm3u8',
                    volume: 0.5,
                    isLive: true,
                    muted: false,
                    autoplay: true,
                    pip: true,
                    autoSize: true,
                    autoMini: true,
                    screenshot: true,
                    setting: true,
                    loop: true,
                    flip: true,
                    playbackRate: true,
                    aspectRatio: true,
                    fullscreen: true,
                    fullscreenWeb: true,
                    subtitleOffset: true,
                    miniProgressBar: true,
                    mutex: true,
                    backdrop: true,
                    playsInline: true,
                    autoPlayback: true,
                    airplay: true,
                    theme: '#23ade5',
                    lang: 'en',
                    moreVideoAttr: {
                        crossOrigin: 'anonymous',
                    },
                    customType: {
                        m3u8: function (video, url) {
                            if (window.Hls.isSupported()) {
                                const hls = new window.Hls();
                                hls.loadSource(url);
                                hls.attachMedia(video);
                                return hls;
                            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                                video.src = url;
                            } else {
                                art.notice.show = 'Unsupported playback format: m3u8';
                            }
                        },
                        mpd: function (video, url) {
                            const player = window.dashjs.MediaPlayer().create();
                            player.initialize(video, url, true);

                            // DRM Configuration (Proxy handles traffic, but we tell player about license server)
                            if (drmScheme && drmScheme !== 'none') {
                                const protectionData = {};
                                // Use original DRMLicense URL if available, or assume handled by proxy?
                                // Usually license server URLs are absolute and external, so they bypass our stream proxy unless rewritten.
                                // But since we are using dash.js, relative paths in MPD are resolved against MPD URL (our proxy).
                                // License URLs in Protection Header (PSSH) might be absolute.
                                // If they are absolute, browser fetches them directly (CORS issues possible).
                                // If we have an explicit license URL in DB, use it.

                                if (channel.drm_license_url) {
                                    if (drmScheme === 'widevine') {
                                        protectionData['com.widevine.alpha'] = {
                                            serverURL: channel.drm_license_url, // Direct fetch (might need CORS proxy if fails)
                                            httpRequestHeaders: { 'Content-Type': 'application/octet-stream' }
                                        };
                                    } else if (drmScheme === 'playready') {
                                        protectionData['com.microsoft.playready'] = {
                                            serverURL: channel.drm_license_url
                                        };
                                    }
                                }
                                player.setProtectionData(protectionData);
                            }
                            return player;
                        }
                    },
                });

                art.on('ready', () => {
                    console.info('Artplayer is ready');
                });

                artInstance.current = art;

            } catch (err) {
                console.error('Artplayer init error:', err);
                setError('Failed to initialize player');
            }
        };

        initPlayer();
    }, [channel]);

    // External Player Intents
    const openExternal = (pkg) => {
        if (!artInstance.current) return;
        const url = artInstance.current.url;

        let intent = '';
        if (pkg === 'vlc') {
            intent = `vlc://${url}`;
        } else if (pkg === 'mx') {
            intent = `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`;
        } else if (pkg === 'ott') {
            intent = `intent:${url}#Intent;package=studio.scillarium.ottnavigator;type=video/*;end`;
        }

        // Check if mobile/android, otherwise just warn or try anyway
        window.location.href = intent;
    };

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
    if (error) return (
        <div className="p-8 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button onClick={() => router.back()} className="px-4 py-2 bg-slate-700 text-white rounded">Back</button>
        </div>
    );
    if (!channel) return <div className="p-8 text-center text-white">Channel not found</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex gap-2">
                    <button onClick={() => openExternal('ott')} className="text-xs px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600">
                        Open in OTT Navigator
                    </button>
                    <button onClick={() => openExternal('vlc')} className="text-xs px-3 py-1 bg-orange-700 text-white rounded hover:bg-orange-600">
                        Open in VLC
                    </button>
                </div>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">
                <div ref={artRef} className="w-full h-full" />
            </div>

            <div className="mt-6 bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h2 className="text-lg font-bold text-white mb-4">Stream Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-400">Format:</span>
                        <span className="ml-2 text-white font-medium">{channel.stream_format?.toUpperCase()}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">DRM:</span>
                        <span className="ml-2 text-white font-medium">{channel.drm_scheme || 'None'}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-slate-400 block mb-1">Source URL:</span>
                        <code className="bg-slate-900 p-2 rounded block text-slate-300 break-all">
                            {channel.url}
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlayerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlayerContent />
        </Suspense>
    );
}
