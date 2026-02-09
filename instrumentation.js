
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { fetchJTVPlaylist } = await import('./lib/jtv-scraper');

        console.log('Initializing JTV Auto-Refresh Scheduler...');

        // Schedule task to run every 4 hours
        // Cron syntax: minute hour day-of-month month day-of-week
        cron.schedule('0 */4 * * *', async () => {
            console.log('Running scheduled JTV playlist refresh...');
            try {
                await fetchJTVPlaylist();
            } catch (error) {
                console.error('Scheduled refresh failed:', error);
            }
        });

        console.log('JTV Auto-Refresh Scheduler initialized (Every 4 hours)');
    }
}
