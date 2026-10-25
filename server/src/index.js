const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
// CORS Configuration: support comma-separated origins, Vercel preview URLs, and local development
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrl
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, health checks)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    // Allow dynamic Vercel preview deployments if an official Vercel origin is configured
    const isVercelPreview = allowedOrigins.some(ao => ao.includes('vercel.app')) && origin.endsWith('.vercel.app');

    if (isExplicitlyAllowed || isVercelPreview) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RepoPilot API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Routes
const analyzeRoutes = require('./routes/analyzeRoutes');
app.use('/api', analyzeRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.send('RepoPilot API is running. Check /api/health for system status.');
});

// Start Server
app.listen(PORT, () => {
  console.log(`[RepoPilot Server] running on http://localhost:${PORT}`);
  console.log(`[RepoPilot Server] Health check available at http://localhost:${PORT}/api/health`);
});
