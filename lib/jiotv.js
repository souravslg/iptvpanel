import { supabase } from './supabase';

const JIOTV_API_BASE = 'https://api.jio.com/v3/users';
const JIOTV_CHANNEL_API = 'https://jiotv.data.cdn.jio.com/apis/v3.0/getMobileChannelList/get/?os=android&devicetype=phone';

export class JioTV {
    static async getSession() {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'jiotv_session')
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
                key: 'jiotv_session',
                value: JSON.stringify(session)
            }, { onConflict: 'key' });

        return !error;
    }

    static async requestOTP(number) {
        try {
            const res = await fetch(`${JIOTV_API_BASE}/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'SxS89476239476239', // Common dummy or extracted key
                },
                body: JSON.stringify({
                    number: `+91${number}`,
                    otpType: 'sms'
                })
            });
            return await res.json();
        } catch (e) {
            return { error: e.message };
        }
    }

    static async verifyOTP(number, otp) {
        try {
            const res = await fetch(`${JIOTV_API_BASE}/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'SxS89476239476239',
                },
                body: JSON.stringify({
                    number: `+91${number}`,
                    otp: otp,
                    deviceInfo: {
                        consumptionDeviceName: 'Samsung SM-G960F',
                        info: {
                            type: 'android',
                            platform: {
                                name: 'goldfish',
                                version: '8.1.0'
                            }
                        }
                    }
                })
            });
            const data = await res.json();
            if (data.authToken) {
                await this.saveSession({
                    number,
                    authToken: data.authToken,
                    refreshToken: data.refreshToken,
                    ssoToken: data.ssoToken,
                    lastUpdated: new Date().toISOString()
                });
            }
            return data;
        } catch (e) {
            return { error: e.message };
        }
    }

    static async fetchChannels() {
        try {
            const res = await fetch(JIOTV_CHANNEL_API);
            const data = await res.json();
            return data.result || [];
        } catch (e) {
            console.error('JioTV Channel Fetch Error:', e);
            return [];
        }
    }

    static async refreshToken() {
        try {
            const session = await this.getSession();
            if (!session || !session.refreshToken) return null;

            const res = await fetch(`https://auth.media.jio.com/tokenservice/apis/v1/refreshtoken?langId=6`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: session.refreshToken })
            });
            const data = await res.json();
            if (data.authToken) {
                const newSession = {
                    ...session,
                    authToken: data.authToken,
                    lastUpdated: new Date().toISOString()
                };
                await this.saveSession(newSession);
                return data.authToken;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    static async getStreamUrl(channelId) {
        const session = await this.getSession();
        if (!session) return null;

        try {
            // Unofficial JioTV playback URL generation
            // This normally involves a few steps, we'll try to get the M3U8 directly
            const res = await fetch(`https://tv.jio.com/api/v1/get_channel_url?channel_id=${channelId}`, {
                headers: {
                    'ssotoken': session.ssoToken,
                    'User-Agent': 'JioTV',
                    'auth-token': session.authToken
                }
            });
            const data = await res.json();
            return data.result || null;
        } catch (e) {
            return null;
        }
    }
}
