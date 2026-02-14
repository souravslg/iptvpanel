
// --- Stream Mode Check ---
let streamMode = 'proxy';
try {
    const { data: modeData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();
    if (modeData?.value) streamMode = modeData.value;
} catch (e) {
    console.error('Error fetching stream_mode:', e);
}
console.log('Stream Mode:', streamMode);

// Check if stream requires cookies (JTV, Hotstar etc)
// If it does, we MUST use proxy mode regardless of setting
// unless the player supports pipe headers in 302 redirect location (rare)
let forceProxy = false;

if (stream.headers) {
    const h = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
    // Check for cookie or Cookie
    if (h.cookie || h.Cookie) {
        console.log('Stream requires cookies. Forcing PROXY mode.');
        forceProxy = true;
    }
}

console.log('Fetching source URL:', targetUrl);

// If Direct/Redirect mode AND not forced to proxy
if ((streamMode === 'direct' || streamMode === 'redirect') && !forceProxy) {
    console.log('Redirecting to direct source:', targetUrl);
    return NextResponse.redirect(targetUrl, { status: 302 });
}
