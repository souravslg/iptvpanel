import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = 'http://localhost:3000';

async function testSharedLinks() {
    console.log('\n🧪 Testing Shared Links Feature\n');

    try {
        // Test 1: Create a shared link with 7-day expiry
        console.log('Test 1: Creating shared link with 7-day expiry...');
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const createResponse = await fetch(`${baseUrl}/api/shared-links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Link - 7 Days',
                sourceUrl: 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u',
                expireDate: sevenDaysFromNow.toISOString().split('T')[0],
                maxUses: null
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create link: ${await createResponse.text()}`);
        }

        const createdLink = await createResponse.json();
        console.log('✅ Created link:', {
            id: createdLink.id,
            link_id: createdLink.link_id,
            name: createdLink.name,
            expire_date: createdLink.expire_date
        });

        const testLinkId = createdLink.link_id;

        // Test 2: Retrieve all shared links
        console.log('\nTest 2: Fetching all shared links...');
        const listResponse = await fetch(`${baseUrl}/api/shared-links`);
        const allLinks = await listResponse.json();
        console.log(`✅ Found ${allLinks.length} shared link(s)`);

        // Test 3: Access the shared M3U URL
        console.log('\nTest 3: Accessing shared M3U URL...');
        const shareResponse = await fetch(`${baseUrl}/share/${testLinkId}`);

        if (shareResponse.status === 200) {
            const m3uContent = await shareResponse.text();
            console.log('✅ M3U content retrieved successfully');
            console.log(`   Content length: ${m3uContent.length} bytes`);
            console.log(`   First line: ${m3uContent.split('\n')[0]}`);
        } else {
            console.log(`❌ Failed to access M3U: ${shareResponse.status} ${shareResponse.statusText}`);
        }

        // Test 4: Create link with max_uses=2, access 3 times
        console.log('\nTest 4: Creating link with max_uses=2...');
        const limitedResponse = await fetch(`${baseUrl}/api/shared-links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Link - Max 2 Uses',
                sourceUrl: 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u',
                expireDate: null,
                maxUses: 2
            })
        });

        const limitedLink = await limitedResponse.json();
        console.log('✅ Created limited link:', limitedLink.link_id);

        // Access twice (should work)
        for (let i = 1; i <= 2; i++) {
            const accessResponse = await fetch(`${baseUrl}/share/${limitedLink.link_id}`);
            console.log(`   Access ${i}: ${accessResponse.status} ${accessResponse.statusText}`);
        }

        // Access third time (should fail)
        const thirdAccess = await fetch(`${baseUrl}/share/${limitedLink.link_id}`);
        console.log(`   Access 3: ${thirdAccess.status} ${thirdAccess.statusText}`);
        if (thirdAccess.status === 403) {
            console.log('✅ Correctly blocked access after max uses');
        } else {
            console.log('❌ Should have blocked access after max uses');
        }

        // Test 5: Create expired link
        console.log('\nTest 5: Creating expired link...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const expiredResponse = await fetch(`${baseUrl}/api/shared-links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Link - Expired',
                sourceUrl: 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u',
                expireDate: yesterday.toISOString().split('T')[0],
                maxUses: null
            })
        });

        const expiredLink = await expiredResponse.json();
        const expiredAccessResponse = await fetch(`${baseUrl}/share/${expiredLink.link_id}`);
        console.log(`   Access expired link: ${expiredAccessResponse.status} ${expiredAccessResponse.statusText}`);
        if (expiredAccessResponse.status === 410) {
            console.log('✅ Correctly returned 410 Gone for expired link');
        } else {
            console.log('❌ Should have returned 410 Gone for expired link');
        }

        // Test 6: Update link to extend expiry
        console.log('\nTest 6: Updating link to extend expiry...');
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        const updateResponse = await fetch(`${baseUrl}/api/shared-links`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: createdLink.id,
                expireDate: newExpiry.toISOString().split('T')[0]
            })
        });

        if (updateResponse.ok) {
            console.log('✅ Successfully updated link expiry to 30 days');
        } else {
            console.log('❌ Failed to update link');
        }

        // Test 7: Delete the test links
        console.log('\nTest 7: Cleaning up - deleting test links...');
        for (const link of [createdLink, limitedLink, expiredLink]) {
            const deleteResponse = await fetch(`${baseUrl}/api/shared-links?id=${link.id}`, {
                method: 'DELETE'
            });
            console.log(`   Deleted ${link.name}: ${deleteResponse.ok ? '✅' : '❌'}`);
        }

        // Test 8: Verify deleted link returns 404
        console.log('\nTest 8: Accessing deleted link...');
        const deletedAccessResponse = await fetch(`${baseUrl}/share/${testLinkId}`);
        console.log(`   Status: ${deletedAccessResponse.status} ${deletedAccessResponse.statusText}`);
        if (deletedAccessResponse.status === 404) {
            console.log('✅ Correctly returned 404 for deleted link');
        } else {
            console.log('❌ Should have returned 404 for deleted link');
        }

        console.log('\n✅ All tests completed!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

testSharedLinks();
