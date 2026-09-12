require('dotenv').config();

const express = require('express');
const path = require('path');
const corsMiddleware = require('../shared/middleware/cors');
const errorHandler = require('../shared/middleware/error-handler');
const { tryConnectDb } = require('../shared/db/connection');
const apiRoutes = require('../routes');

const PORT = process.env.PORT || 3000;
const rootDir = path.resolve(__dirname, '../../');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(corsMiddleware);

// Serve static frontend files from project root
app.use(express.static(rootDir, {
  setHeaders: function (res) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));


// Mount API routes at /api
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

function startServer() {
  const server = app.listen(PORT, function () {
    console.log('HUNAR Modular Server running on http://localhost:' + PORT);
  });
  tryConnectDb();
  return server;
}

module.exports = {
  app,
  startServer
};

if (require.main === module) {
  startServer();
}
