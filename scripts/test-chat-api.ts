import 'dotenv/config';

async function testChatAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing Chat API endpoints...\n');
  
  // You'll need to get a valid auth token from your browser
  // Go to localhost:3000, open DevTools, go to Application > Cookies
  // Find the __session cookie value
  console.log('⚠️  Note: You need to be logged in to localhost:3000 for this test to work');
  console.log('Please ensure you are logged into the Evergreen workspace\n');
  
  // Test organization members endpoint
  console.log('📋 Testing organization members endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/organization/members`, {
      headers: {
        'Cookie': process.env.TEST_SESSION_COOKIE || '',
      }
    });
    
    if (response.ok) {
      const members = await response.json();
      console.log('✅ Found', members.length, 'members');
      members.slice(0, 3).forEach((m: any) => {
        console.log('  -', m.email, '(', m.firstName, m.lastName, ')');
      });
    } else {
      console.log('❌ Failed to fetch members:', response.status, response.statusText);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Error calling members API:', error);
  }
  
  console.log('\n📝 Instructions for manual testing:');
  console.log('1. Open http://localhost:3000/chat in your browser');
  console.log('2. Make sure you are logged into the Evergreen workspace');
  console.log('3. Click on a user in the Direct Messages section');
  console.log('4. Type a message and press Enter or click Send');
  console.log('5. Check the browser console (F12) for any errors');
  console.log('\nIf messages are not sending:');
  console.log('- Check for errors in the browser console');
  console.log('- Check the terminal running npm run dev for server errors');
  console.log('- Verify users are synced by running: npx tsx scripts/sync-users-simple.ts');
}

testChatAPI().catch(console.error);