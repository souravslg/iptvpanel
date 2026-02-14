/**
 * Quick Setup Guide for Shared Links Feature
 * 
 * Follow these steps to complete the setup:
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  SHARED LINKS FEATURE - SETUP INSTRUCTIONS                    ║
╚═══════════════════════════════════════════════════════════════╝

STEP 1: Run SQL in Supabase Dashboard
──────────────────────────────────────
1. Open: https://supabase.com/dashboard/project/utfblxhfyoebonlgtbwz/editor
2. Click "SQL Editor" in the left sidebar
3. Copy and paste the SQL from SETUP_SHARED_LINKS.sql
4. Click "Run" button

STEP 2: Verify the Feature
───────────────────────────
Once SQL is executed, you can:

1. Navigate to: http://localhost:3000/shared-links
2. You should see the "Shared M3U Links" dashboard
3. Click "Create New Link" button
4. Fill in:
   - Name: "Test Customer"
   - Source URL: (pre-filled)
   - Expiry Date: 7 days from now (optional)
   - Max Uses: Leave empty for unlimited

5. Click "Create"
6. Copy the generated link URL
7. Open in new browser tab - should download .m3u file

STEP 3: Share with Customers
─────────────────────────────
Share URLs will look like:
http://localhost:3000/share/a1b2c3d4...

In production (Vercel):
https://iptvpanel.vercel.app/share/a1b2c3d4...

Features:
✓ Time-limited access (set expiry date)
✓ Usage limits (max number of accesses)
✓ Track usage statistics
✓ Activate/deactivate links anytime
✓ Edit or delete links

═════════════════════════════════════════════════════════════════

Need help? Check the walkthrough.md file for detailed documentation.

`);

// Instructions for running
console.log('To verify setup after running SQL:');
console.log('  → node setup_shared_links.mjs\n');
console.log('To run automated tests:');
console.log('  → node test_shared_links.mjs\n');
