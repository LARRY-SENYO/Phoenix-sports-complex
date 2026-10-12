const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./src/config');
const { initSchema } = require('./src/db');
const authRoutes = require('./src/routes/authRoutes');
const sportsRoutes = require('./src/routes/sportsRoutes');
const rlsRoutes = require('./src/routes/rlsRoutes');

const app = express();

// Initialize database schema
initSchema();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/rls', rlsRoutes);

// System Security Architecture Status
app.get('/api/system/status', (req, res) => {
  res.json({
    system: 'Titan Sports Authentication & Row-Level Authorization Engine',
    version: '1.0.0',
    status: 'OPERATIONAL',
    security: {
      userIdentification: 'Active (Unique UUID + Member License Badges)',
      twoFactorAuth: 'Active (RFC 6238 TOTP + QR Codes)',
      saltProtection: 'Active (256-bit dynamic per-user CSPRNG salt)',
      pepperProtection: 'Active (Isolated server-side HMAC-SHA256 secret pepper)',
      keyDerivation: 'Scrypt memory-hard hashing (N=16384, r=8, p=1, keylen=64)',
      authBackupRecovery: 'Active (One-time hashed emergency backup codes)',
      rowLevelAuthorization: 'Active (RowPolicyEngine enforcing entity boundaries)'
    },
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Server listener
if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`================================================================`);
    console.log(` 🏆 TITAN SPORTS AUTHENTICATION & ROW-LEVEL SECURITY SYSTEM 🏆 `);
    console.log(`================================================================`);
    console.log(` Server running at: http://localhost:${config.port}`);
    console.log(` Security Features:`);
    console.log(`   ✓ User Identification (Unique UUID + Member Sports Badges)`);
    console.log(`   ✓ Two-Factor Authentication (RFC 6238 TOTP + Live QR Code)`);
    console.log(`   ✓ Dynamic Per-User Salt (256-bit randomBytes)`);
    console.log(`   ✓ Server-Side Secret Pepper (Isolated from DB via HMAC-SHA256)`);
    console.log(`   ✓ Auth Backup & Recovery (8 Salted Single-Use Backup Codes)`);
    console.log(`   ✓ Row-Level Authorization / RLS (RowPolicyEngine)`);
    console.log(`================================================================\n`);
  });

  // Ensure process stays active indefinitely
  const keepAlive = setInterval(() => {}, 1000 * 60 * 60);
  process.on('SIGINT', () => { clearInterval(keepAlive); server.close(); });
  process.on('SIGTERM', () => { clearInterval(keepAlive); server.close(); });
}

module.exports = app;
