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

        const indianIps = [
            `49.35.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            `103.212.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            `157.36.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        ];
        const randomIp = indianIps[Math.floor(Math.random() * indianIps.length)];

        const strategies = [
            {
                // STRATEGY 1: Modern Mobile API (v1) - 91 format
                url: 'https://jiotvapi.media.jio.com/userservice/v1/loginotp/send',
                headers: {
                    'x-api-key': 'l7xx75e822925f18400490f055697339739a',
                    'app-name': 'RJIL_JioTV',
                    'os': 'android',
                    'devicetype': 'phone',
                    'user-agent': 'JioTV',
                    'X-Forwarded-For': randomIp
                },
                body: { number: `91${cleanNumber}`, otpType: 'sms' }
            },
            {
                // STRATEGY 2: Web API with +91
                url: 'https://api.jio.com/v3/users/login/otp/send',
                headers: {
                    'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                    'origin': 'https://www.jiotv.com',
                    'referer': 'https://www.jiotv.com/',
                    'X-Forwarded-For': randomIp
                },
                body: { number: `+91${cleanNumber}`, otpType: 'sms' }
            },
            {
                // STRATEGY 3: Alternative Web API - Plain 10 digits
                url: 'https://api.jio.com/v3/users/login/otp/send',
                headers: {
                    'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                    'X-Forwarded-For': randomIp
                },
                body: { number: cleanNumber, otpType: 'sms' }
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
                try {
                    const data = JSON.parse(text);
                    if (res.ok && !data.error && !data.message?.toLowerCase().includes('fail')) return data;
                    lastError = data.message || data.error || `Error ${res.status}`;
                } catch (e) {
                    lastError = `Status ${res.status}`;
                }
            } catch (e) {
                lastError = e.message;
            }
        }

        return { error: `JioTV Handshake Failed: ${lastError}. Please ensure this is a Jio Mobile number.` };
    }

    static async verifyOTP(number, otp) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');

        // Try multiple verification formats
        const verifyUrls = [
            { url: 'https://jiotvapi.media.jio.com/userservice/v1/loginotp/verify', body: { number: `91${cleanNumber}`, otp } },
            { url: 'https://api.jio.com/v3/users/login/otp/verify', body: { number: `+91${cleanNumber}`, otp } }
        ];

        for (const v of verifyUrls) {
            try {
                const res = await fetch(v.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': v.url.includes('jiotvapi') ? 'l7xx75e822925f18400490f055697339739a' : 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',
                        'app-name': 'RJIL_JioTV',
                        'os': 'android',
                        'devicetype': 'phone'
                    },
                    body: JSON.stringify(v.body)
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
        return { error: 'OTP Verification Failed' };
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
