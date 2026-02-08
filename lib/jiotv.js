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
        const finalNumber = `91${cleanNumber}`;

        const indianIps = [
            `49.32.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            `103.210.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            `157.34.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        ];
        const randomIp = indianIps[Math.floor(Math.random() * indianIps.length)];

        const strategies = [
            {
                // WEB STRATEGY
                url: 'https://api.jio.com/v3/users/login/otp/send',
                headers: {
                    'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                    'origin': 'https://www.jiotv.com',
                    'referer': 'https://www.jiotv.com/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'X-Forwarded-For': randomIp
                },
                body: { number: finalNumber, otpType: 'sms' }
            },
            {
                // MOBILE STRATEGY (FALLBACK 1)
                url: 'https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/send',
                headers: {
                    'x-api-key': 'l7xx75e822925f184370b2e25170c5d5820a',
                    'appname': 'RJIL_JioTV',
                    'os': 'android',
                    'devicetype': 'phone',
                    'user-agent': 'okhttp/4.9.1',
                    'X-Forwarded-For': randomIp
                },
                body: { number: finalNumber, otpType: 'sms' }
            }
        ];

        let lastError = null;
        for (const strat of strategies) {
            try {
                const res = await fetch(strat.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...strat.headers },
                    body: JSON.stringify(strat.body)
                });

                const text = await res.text();
                console.log('Jio Response:', text);

                try {
                    const data = JSON.parse(text);
                    if (res.ok && !data.error) return data;
                    lastError = data.message || data.error || `Status ${res.status}`;
                } catch (e) {
                    lastError = `Invalid JSON (Status ${res.status})`;
                }
            } catch (e) {
                lastError = e.message;
            }
        }

        return { error: `JioTV blocked the panel. Reason: ${lastError}` };
    }

    static async verifyOTP(number, otp) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
        const finalNumber = `91${cleanNumber}`;

        const res = await fetch(`https://api.jio.com/v3/users/login/otp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                'origin': 'https://www.jiotv.com',
                'referer': 'https://www.jiotv.com/'
            },
            body: JSON.stringify({
                number: finalNumber,
                otp: otp,
                deviceInfo: {
                    consumptionDeviceName: 'Chrome Windows',
                    info: { type: 'web', platform: { name: 'windows', version: '10' } }
                }
            })
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
        return data;
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
