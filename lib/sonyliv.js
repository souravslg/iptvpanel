import { supabase } from './supabase';

export class SonyLiv {
    static async getSession() {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'sonyliv_session')
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
                key: 'sonyliv_session',
                value: JSON.stringify(session)
            }, { onConflict: 'key' });

        return !error;
    }

    /**
     * Request OTP from SonyLiv
     */
    static async requestOTP(number) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');

        try {
            const url = 'https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/CREATEOTP-V2';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.sonyliv.com',
                    'Referer': 'https://www.sonyliv.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    mobileNumber: cleanNumber,
                    countryCode: '91'
                })
            });

            const data = await res.json();
            if (res.ok && data.resultCode === 'OK') {
                return { success: true, message: 'OTP Sent Successfully' };
            }
            return { error: data.message || 'Failed to send OTP' };
        } catch (e) {
            return { error: e.message };
        }
    }

    /**
     * Verify OTP and get Auth Token
     */
    static async verifyOTP(number, otp) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');

        try {
            const url = 'https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/VERIFYOTP-V2';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.sonyliv.com',
                    'Referer': 'https://www.sonyliv.com/'
                },
                body: JSON.stringify({
                    mobileNumber: cleanNumber,
                    otp: otp,
                    countryCode: '91',
                    deviceInfo: {
                        deviceId: Math.random().toString(36).substring(7),
                        deviceType: 'WEB'
                    }
                })
            });

            const data = await res.json();
            if (res.ok && data.resultCode === 'OK') {
                const session = {
                    number: cleanNumber,
                    authToken: data.resultObj.userIdentity, // Sony uses userIdentity as token
                    tokenType: data.resultObj.tokenType,
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
     * Fetch SonyLiv Channel List
     */
    static async fetchChannels() {
        try {
            // SonyLiv doesn't have a simple public 'all channels' JSON. 
            // We usually scrape the VOD search or specific category.
            const url = 'https://www.sonyliv.com/api/v4/vod/search?category=Live%20TV&limit=100';
            const res = await fetch(url);
            const data = await res.json();

            return (data.resultObj?.containers || []).map(ch => ({
                id: ch.id,
                name: ch.name,
                image: ch.imageList?.[0]?.url,
                stream_id: `sonyliv-${ch.id}`
            }));
        } catch (e) {
            console.error('SonyLiv Channel Fetch Error:', e);
            return [];
        }
    }

    /**
     * Get Stream Manifest and DRM Keys
     */
    static async getStreamUrl(channelId) {
        const session = await this.getSession();
        if (!session) return null;

        try {
            // This is a simplified version. Sony requires complex token signed requests.
            const url = `https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/GETSTREAM-V2?contentId=${channelId}`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.authToken}`,
                    'X-Device-Id': 'web-v1'
                }
            });
            const data = await res.json();

            if (data.resultCode === 'OK') {
                return {
                    url: data.resultObj.videoUrl,
                    licenseUrl: data.resultObj.licenseUrl,
                    isDrm: !!data.resultObj.licenseUrl
                };
            }
        } catch (e) {
            console.error('SonyLiv Stream URL Error:', e);
        }
        return null;
    }
}
