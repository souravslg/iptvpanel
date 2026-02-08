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

    /**
     * OMNI-HANDSHAKE: Tries multiple known JioTV OTP endpoints and credential sets
     * to bypass 403 Forbidden errors and IP blacklisting.
     */
    static async requestOTP(number) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
        const indianIps = [
            '49.32.180.12', '103.210.45.19', '157.34.88.201', '49.35.120.44'
        ];
        const randomIp = indianIps[Math.floor(Math.random() * indianIps.length)];

        // Core Credential Sets
        const keys = {
            MOBILE: 'l7xx75e822925f184370b2e25170c5d5820a', // Modern Mobile Key
            OLD_MOBILE: 'l7xx75e822925f18400490f055697339739a',
            WEB: 'l7xx938b6684ee9e4bbe8831a9a682b8e19f',    // Web Interface Key
            MYJIO: 'Sx89476239476239'
        };

        const strategies = [
            {
                name: 'Mobile-V1-Primary',
                url: 'https://jiotvapi.media.jio.com/userservice/v1/loginotp/send',
                headers: {
                    'x-api-key': keys.MOBILE,
                    'app-name': 'RJIL_JioTV',
                    'os': 'android',
                    'devicetype': 'phone',
                    'User-Agent': 'JioTV/2409140445 (Linux; U; Android 13; en_US; SM-S918B; Build/TP1A.220624.014; )'
                },
                body: { number: `91${cleanNumber}`, otpType: 'sms' }
            },
            {
                name: 'Web-V3-Unified',
                url: 'https://api.jio.com/v3/users/login/otp/send',
                headers: {
                    'x-api-key': keys.WEB,
                    'origin': 'https://www.jiotv.com',
                    'referer': 'https://www.jiotv.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                },
                body: { number: `+91${cleanNumber}`, otpType: 'sms' }
            },
            {
                name: 'Auth-API-V2',
                url: 'https://auth-api.jio.com/v2/users/otp/send',
                headers: {
                    'x-api-key': keys.WEB,
                    'app-name': 'RJIL_JioTV'
                },
                body: { number: `+91${cleanNumber}`, otpType: 'sms' }
            },
            {
                name: 'Legacy-APIs-Proxy',
                url: 'https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/send',
                headers: {
                    'x-api-key': keys.OLD_MOBILE,
                    'appname': 'RJIL_JioTV',
                    'X-Forwarded-For': randomIp
                },
                body: { number: `91${cleanNumber}`, otpType: 'sms' }
            }
        ];

        let lastError = null;
        for (const strat of strategies) {
            try {
                console.log(`Starting Handshake: ${strat.name}`);
                const res = await fetch(strat.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...strat.headers },
                    body: JSON.stringify(strat.body)
                });

                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    // Check for common Jio success markers
                    if (res.ok && !data.error && !data.message?.toLowerCase().includes('fail')) {
                        console.log(`Handshake Success: ${strat.name}`);
                        return data;
                    }
                    lastError = data.message || data.error || `Status ${res.status}`;
                } catch (e) {
                    lastError = `Status ${res.status} (Raw: ${text.substring(0, 30)})`;
                }
                console.warn(`${strat.name} failed: ${lastError}`);
            } catch (e) {
                lastError = e.message;
            }
        }

        return {
            error: `All authentication routes are blocked (Last Error: ${lastError}).`,
            hint: 'This usually means Jio has blocked the cloud provider IP. Try again in 5 minutes.'
        };
    }

    static async verifyOTP(number, otp) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');

        const strategies = [
            {
                url: 'https://jiotvapi.media.jio.com/userservice/v1/loginotp/verify',
                headers: { 'x-api-key': 'l7xx75e822925f184370b2e25170c5d5820a', 'app-name': 'RJIL_JioTV' },
                body: { number: `91${cleanNumber}`, otp }
            },
            {
                url: 'https://api.jio.com/v3/users/login/otp/verify',
                headers: { 'x-api-key': 'l7xx938b6684ee9e4bbe8831a9a682b8e19f' },
                body: { number: `+91${cleanNumber}`, otp }
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
        return { error: 'Verification failed.' };
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
