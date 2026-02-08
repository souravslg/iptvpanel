import { supabase } from './supabase';

export class TataPlay {
    static async getSession() {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'tataplay_session')
            .single();

        if (error || !data) return null;
        try {
            return JSON.parse(data.value);
        } catch (e) {
            return null;
        }
    }

    static async saveSession(session) {
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: 'tataplay_session',
                value: JSON.stringify(session)
            }, { onConflict: 'key' });

        return !error;
    }

    static getRandomIndianIP() {
        const ranges = [
            '49.32.', '103.21.', '106.210.', '117.211.', '157.34.', '1.38.', '27.56.'
        ];
        const range = ranges[Math.floor(Math.random() * ranges.length)];
        return range + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
    }

    /**
     * Request OTP from Tata Play
     */
    static async requestOTP(sid) {
        const ip = this.getRandomIndianIP();

        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
            console.log(`[TataPlay] Requesting OTP for SID: ${sid} with IP: ${ip}`);
            const url = 'https://tm.tataplay.com/tap-api/v1/user/login/otp/send';

            const res = await fetch(url, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': 'web-v1',
                    'Origin': 'https://watch.tataplay.com',
                    'Referer': 'https://watch.tataplay.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'X-Forwarded-For': ip,
                    'Client-IP': ip
                },
                body: JSON.stringify({
                    subscriberId: sid
                })
            });

            clearTimeout(timeoutId);

            console.log(`[TataPlay] Response status: ${res.status}`);

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[TataPlay] Non-JSON response:', text);
                return { error: `Server error: Invalid response format` };
            }

            console.log('[TataPlay] Response data:', data);

            if (res.ok && data.status === 'SUCCESS') {
                return { success: true, message: 'OTP Sent' };
            }
            return { error: data.message || `API Error: ${data.status || 'Unknown'}` };
        } catch (e) {
            clearTimeout(timeoutId);
            console.error('[TataPlay] Request failed:', e);

            if (e.name === 'AbortError') {
                return { error: 'Request timeout - Tata Play servers not responding. Please try again.' };
            }

            // Provide more specific error messages
            if (e.message.includes('fetch failed')) {
                return {
                    error: 'Cannot connect to Tata Play servers from this hosting provider. Please use the manual token entry method below, or contact support for proxy setup.'
                };
            }

            return { error: `Connection Error: ${e.message}` };
        }
    }

    /**
     * Verify OTP and get Auth Token
     */
    static async verifyOTP(sid, otp) {
        const ip = this.getRandomIndianIP();
        try {
            const url = 'https://tm.tataplay.com/tap-api/v1/user/login/otp/verify';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': 'web-v1',
                    'Origin': 'https://watch.tataplay.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'X-Forwarded-For': ip
                },
                body: JSON.stringify({
                    subscriberId: sid,
                    otp: otp
                })
            });

            const data = await res.json();
            if (res.ok && data.status === 'SUCCESS') {
                const session = {
                    sid: sid,
                    accessToken: data.data.accessToken,
                    refreshToken: data.data.refreshToken,
                    userToken: data.data.userToken,
                    lastUpdated: new Date().toISOString()
                };
                await this.saveSession(session);
                return { success: true, data: session };
            }
            return { error: data.message || 'OTP Verification Failed' };
        } catch (e) {
            return { error: `Verification Error: ${e.message}` };
        }
    }

    /**
     * MANUAL METHOD: Save tokens directly from browser
     * Instructions for users:
     * 1. Open https://watch.tataplay.com in your browser
     * 2. Login with your credentials
     * 3. Open DevTools (F12) and go to Network tab
     * 4. Find any API request and copy the Authorization header
     * 5. Use this method to save it
     */
    static async saveManualSession(sid, accessToken, refreshToken, userToken) {
        const session = {
            sid: sid,
            accessToken: accessToken,
            refreshToken: refreshToken,
            userToken: userToken || accessToken,
            lastUpdated: new Date().toISOString()
        };
        const success = await this.saveSession(session);
        return success ? { success: true, data: session } : { error: 'Failed to save session' };
    }

    /**
     * Fetch Subscribed Channels
     */
    static async fetchChannels() {
        const session = await this.getSession();
        if (!session) return [];

        try {
            // Using a standard public master-list or API endpoint 
            // In a real implementation, we fetch the entitlement list.
            const url = 'https://tm.tataplay.com/tap-api/v1/content/channels';
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'x-device-id': 'web-v1'
                }
            });
            const data = await res.json();

            return (data.data || []).map(ch => ({
                id: ch.id || ch.channelId,
                name: ch.name || ch.title,
                image: ch.logo || ch.image,
                stream_id: `tataplay-${ch.id || ch.channelId}`
            }));
        } catch (e) {
            console.error('TataPlay Channel Fetch Error:', e);
            // Fallback: If API fails, return some common channel IDs if needed
            return [];
        }
    }

    /**
     * Get Stream URL and License
     */
    static async getStreamUrl(channelId) {
        const session = await this.getSession();
        if (!session) return null;

        const ip = this.getRandomIndianIP();
        try {
            const url = `https://tm.tataplay.com/tap-api/v1/content/get-stream?id=${channelId}&type=LIVE`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'x-device-id': 'web-v1',
                    'X-Forwarded-For': ip,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
            const data = await res.json();

            if (data.status === 'SUCCESS') {
                return {
                    url: data.data.streamUrl,
                    licenseUrl: data.data.licenseUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Origin': 'https://watch.tataplay.com',
                        'X-Forwarded-For': ip
                    }
                };
            }
        } catch (e) {
            console.error('TataPlay Stream Error:', e);
        }
        return null;
    }
}
