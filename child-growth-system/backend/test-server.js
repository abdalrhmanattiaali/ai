// Simple test server to verify everything works
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// Test setup status endpoint
app.get('/api/setup/status', (req, res) => {
  res.json({
    isSetup: false,
    message: 'Test endpoint working!'
  });
});

// Test configure endpoint
app.post('/api/setup/configure', (req, res) => {
  console.log('Received setup data:', req.body);
  res.json({
    success: true,
    message: 'Configuration received!',
    data: req.body
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║     TEST SERVER RUNNING                       ║
║     Port: ${PORT}                             ║
║     Status: ✅ Ready                          ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
  console.log('\nTest URLs:');
  console.log('  - http://localhost:5000/health');
  console.log('  - http://localhost:5000/api/setup/status');
  console.log('');
});
