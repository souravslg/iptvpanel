export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('Server instrumentation initialized.');
        // Vercel/Serverless: 
        // Background tasks should be handled by Vercel Cron Jobs (configured in vercel.json)
        // or external triggers calling the API endpoints.
        // Filesystem writes (fs.writeFileSync) are ephemeral in serverless and should be avoided.
        // Data is persisted to Supabase.
    }
}
