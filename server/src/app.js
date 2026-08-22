const express = require('express');
const aiRoutes = require('./ai/aiRoutes');

const app = express();

app.use(express.json({ limit: '16kb' }));
app.use('/api/ai', aiRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request body.' });
  }

  console.error('Unhandled request error:', error.message);
  return res.status(500).json({ success: false, message: 'Internal server error.' });
});

module.exports = app;

