const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Security helper: verify that request is local
function isLocalRequest(req) {
  const ip = req.ip || req.connection.remoteAddress;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    req.hostname === 'localhost' ||
    req.hostname === '127.0.0.1'
  );
}

// API: Get portfolio data
app.get('/api/data', (req, res) => {
  const dataPath = path.join(__dirname, 'data.json');
  if (fs.existsSync(dataPath)) {
    try {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      return res.json(JSON.parse(rawData));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to parse data file' });
    }
  } else {
    return res.status(404).json({ error: 'Data file not found' });
  }
});

// API: Save portfolio data (localhost only)
app.post('/api/save', (req, res) => {
  if (!isLocalRequest(req)) {
    return res.status(403).json({ error: 'Unauthorized: Edits are only allowed from local machine (localhost)' });
  }

  const dataPath = path.join(__dirname, 'data.json');
  const backupPath = path.join(__dirname, 'data.backup.json');
  const newData = req.body;

  if (!newData || typeof newData !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    // 1. Create a backup of existing data if it exists
    if (fs.existsSync(dataPath)) {
      fs.copyFileSync(dataPath, backupPath);
    }

    // 2. Write the new data
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf8');

    console.log(`[Success] Portfolio data updated and backup created at ${new Date().toLocaleTimeString()}`);
    return res.json({ success: true, message: 'Portfolio updated successfully' });
  } catch (error) {
    console.error('[Error] Failed to save portfolio:', error);
    return res.status(500).json({ error: 'Failed to write data to disk' });
  }
});

// Start the server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`==================================================`);
  console.log(` Portfolio Admin Server running locally at:`);
  console.log(` http://localhost:${PORT}`);
  console.log(` http://localhost:${PORT}/admin.html (Admin Panel)`);
  console.log(`==================================================`);
});
