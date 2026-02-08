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

    /**
     * Request OTP from Tata Play
     */
    static async requestOTP(sid) {
        try {
            const url = 'https://tm.tataplay.com/tap-api/v1/user/login/otp/send';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': 'web-v1',
                    'Origin': 'https://watch.tataplay.com',
                    'Referer': 'https://watch.tataplay.com/'
                },
                body: JSON.stringify({
                    subscriberId: sid
                })
            });

            const data = await res.json();
            if (res.ok && data.status === 'SUCCESS') {
                return { success: true, message: 'OTP Sent' };
            }
            return { error: data.message || 'Failed to send OTP' };
        } catch (e) {
            return { error: e.message };
        }
    }

    /**
     * Verify OTP and get Auth Token
     */
    static async verifyOTP(sid, otp) {
        try {
            const url = 'https://tm.tataplay.com/tap-api/v1/user/login/otp/verify';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': 'web-v1',
                    'Origin': 'https://watch.tataplay.com'
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
            return { error: e.message };
        }
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

        try {
            const url = `https://tm.tataplay.com/tap-api/v1/content/get-stream?id=${channelId}&type=LIVE`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'x-device-id': 'web-v1'
                }
            });
            const data = await res.json();

            if (data.status === 'SUCCESS') {
                return {
                    url: data.data.streamUrl,
                    licenseUrl: data.data.licenseUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Origin': 'https://watch.tataplay.com'
                    }
                };
            }
        } catch (e) {
            console.error('TataPlay Stream Error:', e);
        }
        return null;
    }
}
