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

    static getRandomIndianIP() {
        const ranges = [
            '49.32.', '103.21.', '106.210.', '117.211.', '157.34.', '1.38.', '27.56.'
        ];
        const range = ranges[Math.floor(Math.random() * ranges.length)];
        return range + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
    }

    static async requestOTP(number) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
        const ip = this.getRandomIndianIP();

        // Multiple versions and platforms for fallback to bypass geo-restrictions
        const versions = ['1.6', '1.4', '1.9', '1.3'];
        const platforms = ['WEB', 'ANDROID'];
        let lastError = null;

        for (const p of platforms) {
            for (const v of versions) {
                try {
                    const url = `https://apiv2.sonyliv.com/AGL/${v}/A/ENG/${p}/IN/HR/CREATEOTP-V2`;
                    console.log(`Trying SonyLiv OTP ${p} v${v} for ${cleanNumber}...`);

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Origin': p === 'WEB' ? 'https://www.sonyliv.com' : undefined,
                            'Referer': p === 'WEB' ? 'https://www.sonyliv.com/' : undefined,
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                            'X-Forwarded-For': ip,
                            'Client-IP': ip,
                            'X-Requested-With': p === 'ANDROID' ? 'com.sonyliv' : undefined,
                        },
                        body: JSON.stringify({
                            mobileNumber: cleanNumber,
                            countryCode: '91'
                        })
                    });

                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        if (res.ok && data.resultCode === 'OK') {
                            return { success: true, message: `OTP Sent Successfully (${p} v${v})` };
                        }
                        lastError = data.message || `Failed with ${p} v${v}`;
                    } else {
                        lastError = `Non-JSON response from ${p} v${v} (${res.status})`;
                    }
                } catch (e) {
                    lastError = e.message;
                }
            }
        }
        return { error: lastError || 'Failed to send OTP' };
    }

    /**
     * Verify OTP and get Auth Token
     */
    static async verifyOTP(number, otp) {
        const cleanNumber = number.replace(/\+/g, '').replace(/^91/, '');
        const ip = this.getRandomIndianIP();

        try {
            const url = 'https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/VERIFYOTP-V2';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.sonyliv.com',
                    'Referer': 'https://www.sonyliv.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'X-Forwarded-For': ip
                },
                body: JSON.stringify({
                    mobileNumber: cleanNumber,
                    otp: otp,
                    countryCode: '91'
                })
            });

            const data = await res.json();
            if (res.ok && data.resultCode === 'OK') {
                const session = {
                    number: cleanNumber,
                    token: data.resultObj.jwt,
                    userId: data.resultObj.userId,
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
     * MANUAL METHOD: Save tokens directly from browser
     * Instructions for users:
     * 1. Open https://www.sonyliv.com in your browser
     * 2. Login with your mobile number and OTP
     * 3. Open DevTools (F12) and go to Network tab
     * 4. Find any API request to apiv2.sonyliv.com
     * 5. Copy the Authorization header (JWT token)
     * 6. Use this method to save it
     */
    static async saveManualSession(mobileNumber, token, userId) {
        const cleanNumber = mobileNumber.replace(/\+/g, '').replace(/^91/, '');
        const session = {
            number: cleanNumber,
            token: token,
            userId: userId || 'manual',
            lastUpdated: new Date().toISOString()
        };
        const success = await this.saveSession(session);
        return success ? { success: true, data: session } : { error: 'Failed to save session' };
    }

    static async fetchChannels() {
        try {
            // Using search API for channels
            const url = 'https://www.sonyliv.com/api/v4/vod/search?q=Live+TV&from=0&size=100';
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
            const data = await res.json();

            // Extract channels from search results
            // Structure check: resultObj.containers is common in SonyLiv API
            const containers = data.resultObj?.containers || [];
            const channels = [];

            for (const container of containers) {
                if (container.assets) {
                    for (const asset of container.assets) {
                        if (asset.assetType === 'Channel' || asset.type === 'CHANNEL') {
                            channels.push({
                                id: asset.id,
                                name: asset.title,
                                image: asset.imageUrl || asset.images?.find(i => i.type === 'Thumbnail')?.url,
                                stream_id: `sonyliv-${asset.id}`
                            });
                        }
                    }
                }
            }

            return channels;
        } catch (e) {
            console.error('SonyLiv Channel Fetch Error:', e);
            return [];
        }
    }

    static async getStreamUrl(channelId) {
        const session = await this.getSession();
        if (!session) return null;

        try {
            const url = `https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/PLAY/CHANNEL/${channelId}?is_playback_tracking=true`;
            const ip = this.getRandomIndianIP();

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.token}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Origin': 'https://www.sonyliv.com',
                    'X-Forwarded-For': ip
                }
            });
            const data = await res.json();
            if (res.ok && data.resultCode === 'OK') {
                return {
                    url: data.resultObj.videoUrl,
                    licenseUrl: data.resultObj.licenseUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Origin': 'https://www.sonyliv.com'
                    }
                };
            }
        } catch (e) {
            console.error('SonyLiv Stream Error:', e);
        }
        return null;
    }
}
