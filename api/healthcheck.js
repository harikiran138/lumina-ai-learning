const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  if (res.statusCode >= 200 && res.statusCode < 300) {
    process.exit(0);
  } else {
    console.error('Health check failed with status', res.statusCode);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
