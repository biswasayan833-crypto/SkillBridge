// Direct Verification of Vercel Serverless Entry Point (server/api/index.js)
const http = require('http');
const path = require('path');
const dotenv = require('../server/node_modules/dotenv');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const vercelHandler = require('../server/api/index');

const origin = 'https://skill-bridge-dokcv8jd0-ayan-biswas.vercel.app';
const testPort = 5099;

const server = http.createServer(async (req, res) => {
  await vercelHandler(req, res);
});

server.listen(testPort, async () => {
  console.log(`Serverless local wrapper running on port ${testPort}`);

  const runTest = async () => {
    try {
      // 1. Test OPTIONS /api/auth/login
      console.log('\n--- 1. Testing serverless entry: OPTIONS /api/auth/login ---');
      const optRes = await fetch(`http://localhost:${testPort}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      });

      console.log(`OPTIONS Status: ${optRes.status}`);
      console.log(`Access-Control-Allow-Origin: ${optRes.headers.get('access-control-allow-origin')}`);
      console.log(`Access-Control-Allow-Methods: ${optRes.headers.get('access-control-allow-methods')}`);

      if (optRes.status === 200 && optRes.headers.get('access-control-allow-origin') === origin) {
        console.log('✅ [PASS] Serverless OPTIONS preflight succeeded with 200 and correct CORS');
      } else {
        console.error('❌ [FAIL] Serverless OPTIONS preflight failed');
      }

      // 2. Test POST /api/auth/login with invalid password
      console.log('\n--- 2. Testing serverless entry: POST /api/auth/login ---');
      const loginRes = await fetch(`http://localhost:${testPort}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent_vercel_test@example.com',
          password: 'WrongPassword123!',
        }),
      });

      console.log(`Login Status: ${loginRes.status}`);
      console.log(`Access-Control-Allow-Origin: ${loginRes.headers.get('access-control-allow-origin')}`);
      const loginBody = await loginRes.json();
      console.log('Login Response:', loginBody);

      if (loginRes.status === 401 && loginRes.headers.get('access-control-allow-origin') === origin) {
        console.log('✅ [PASS] Serverless POST /api/auth/login processed correctly with 401 and CORS headers');
      } else {
        console.error('❌ [FAIL] Serverless POST /api/auth/login failed');
      }

      // 3. Test GET /api/health
      console.log('\n--- 3. Testing serverless entry: GET /api/health ---');
      const healthRes = await fetch(`http://localhost:${testPort}/api/health`, {
        headers: { 'Origin': origin },
      });
      const healthBody = await healthRes.json();
      console.log('Health Response:', healthBody);

      if (healthRes.status === 200 && healthBody.success) {
        console.log('✅ [PASS] Serverless GET /api/health succeeded');
      } else {
        console.error('❌ [FAIL] Serverless GET /api/health failed');
      }

    } catch (err) {
      console.error('Test error:', err);
    } finally {
      server.close(() => {
        console.log('\nServerless test wrapper stopped cleanly.');
        process.exit(0);
      });
    }
  };

  await runTest();
});
