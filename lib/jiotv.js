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
            const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
            const finalNumber = `91${cleanNumber}`;

            console.log('Requesting JioTV OTP for:', finalNumber);

            const headers = {
                'Content-Type': 'application/json',
                'x-api-key': 'l7xx75e822925f184370b2e25170c5d5820a',
                'appname': 'RJIL_JioTV',
                'os': 'android',
                'devicetype': 'phone',
                'user-agent': 'okhttp/4.9.1',
                'x-device-id': 'b8e976b5-0000-4000-8000-' + Math.random().toString(16).slice(2, 14)
            };

            const payload = {
                number: finalNumber,
                otpType: 'sms'
            };

            let res = await fetch(`https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/send`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            // Fallback to different endpoint if first fails
            if (!res.ok) {
                console.log('Primary OTP endpoint failed, trying fallback...');
                res = await fetch(`https://api.jio.com/v3/users/otp/send`, {
                    method: 'POST',
                    headers: { ...headers, 'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f' },
                    body: JSON.stringify(payload)
                });
            }

            const text = await res.text();
            console.log('JioTV OTP raw response:', text);

            if (!text || text.trim().length === 0) {
                return { error: `Server returned an empty response (Status: ${res.status}). Please try again later.` };
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                return { error: `Invalid server response: ${text.substring(0, 50)}`, status: res.status };
            }
        } catch (e) {
            console.error('JioTV RequestOTP Exception:', e);
            return { error: `Connection error: ${e.message}` };
        }
    }

    static async verifyOTP(number, otp) {
        try {
            const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
            const finalNumber = `91${cleanNumber}`;

            const res = await fetch(`https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'l7xx75e822925f184370b2e25170c5d5820a',
                    'appname': 'RJIL_JioTV',
                    'os': 'android',
                    'devicetype': 'phone',
                    'user-agent': 'okhttp/4.9.1'
                },
                body: JSON.stringify({
                    number: finalNumber,
                    otp: otp,
                    deviceInfo: {
                        consumptionDeviceName: 'SM-G975F',
                        info: {
                            type: 'android',
                            platform: {
                                name: 'goldfish',
                                version: '9'
                            }
                        }
                    }
                })
            });

            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (data.ssoToken || data.authToken) {
                    await this.saveSession({
                        number: finalNumber,
                        authToken: data.authToken,
                        refreshToken: data.refreshToken,
                        ssoToken: data.ssoToken,
                        jToken: data.jToken,
                        lastUpdated: new Date().toISOString()
                    });
                }
                return data;
            } catch (e) {
                return { error: `Invalid verification response: ${text.substring(0, 50)}` };
            }
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
