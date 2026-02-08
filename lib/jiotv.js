import { supabase } from './supabase';

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
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
        const strategies = [
            {
                url: 'https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/send',
                headers: {
                    'x-api-key': 'l7xx75e822925f184370b2e25170c5d5820a',
                    'appname': 'RJIL_JioTV',
                    'os': 'android',
                    'devicetype': 'phone',
                    'user-agent': 'okhttp/4.9.1'
                },
                body: { number: `91${cleanNumber}`, otpType: 'sms' }
            },
            {
                url: 'https://api.jio.com/v3/users/otp/send',
                headers: {
                    'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                    'appName': 'RJIL_JioTV',
                    'os': 'Android',
                    'deviceId': 'b8e976b5-0000-4000-8000-' + Math.random().toString(16).slice(2, 14)
                },
                body: { number: `+91${cleanNumber}`, otpType: 'sms' }
            },
            {
                url: 'https://api.jio.com/v3/users/otp/send',
                headers: {
                    'x-api-key': 'SxS89476239476239',
                    'appName': 'RJIL_JioTV'
                },
                body: { identifier: `91${cleanNumber}`, otpType: 'sms' }
            }
        ];

        let lastError = null;
        for (const [index, strat] of strategies.entries()) {
            try {
                console.log(`Trying JioTV Strategy ${index + 1}...`);
                const res = await fetch(strat.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...strat.headers
                    },
                    body: JSON.stringify(strat.body)
                });

                const text = await res.text();
                console.log(`Strategy ${index + 1} response:`, text);

                try {
                    const data = JSON.parse(text);
                    // If server returns success we return immediately
                    if (res.ok && !data.error) return data;
                    lastError = data.message || data.error || `Status ${res.status}`;
                } catch (e) {
                    lastError = `Invalid JSON: ${text.substring(0, 50)}`;
                }
            } catch (e) {
                lastError = e.message;
            }
        }

        return { error: `All 3 login methods failed. Last error: ${lastError}` };
    }

    static async verifyOTP(number, otp) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
        const strategies = [
            {
                url: 'https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/verify',
                headers: {
                    'x-api-key': 'l7xx75e822925f184370b2e25170c5d5820a',
                    'appname': 'RJIL_JioTV'
                },
                body: {
                    number: `91${cleanNumber}`,
                    otp: otp,
                    deviceInfo: { consumptionDeviceName: 'SM-G975F', info: { type: 'android', platform: { name: 'goldfish', version: '9' } } }
                }
            },
            {
                url: 'https://api.jio.com/v3/users/otp/verify',
                headers: {
                    'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                    'appName': 'RJIL_JioTV'
                },
                body: {
                    number: `+91${cleanNumber}`,
                    otp: otp
                }
            }
        ];

        for (const strat of strategies) {
            try {
                const res = await fetch(strat.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...strat.headers },
                    body: JSON.stringify(strat.body)
                });
                const data = await res.json();
                if (data.authToken || data.ssoToken) {
                    await this.saveSession({
                        number: cleanNumber,
                        authToken: data.authToken,
                        refreshToken: data.refreshToken,
                        ssoToken: data.ssoToken,
                        jToken: data.jToken,
                        lastUpdated: new Date().toISOString()
                    });
                    return data;
                }
            } catch (e) { }
        }
        return { error: 'Verification failed across all endpoints.' };
    }

    static async fetchChannels() {
        const CH_API = 'https://jiotv.data.cdn.jio.com/apis/v3.0/getMobileChannelList/get/?os=android&devicetype=phone';
        try {
            const res = await fetch(CH_API);
            const data = await res.json();
            return data.result || [];
        } catch (e) {
            return [];
        }
    }

    static async getStreamUrl(channelId) {
        const session = await this.getSession();
        if (!session) return null;
        try {
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
                await this.saveSession({ ...session, authToken: data.authToken, lastUpdated: new Date().toISOString() });
                return data.authToken;
            }
        } catch (e) { }
        return null;
    }
}
