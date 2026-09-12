const express = require('express');
const { isConnected } = require('./shared/db/connection');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const servicesRoutes = require('./modules/services/services.routes');

const router = express.Router();

// Health check endpoint (maintains existing contract)
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    db: 'hunar',
    collection: 'jobs',
    connected: isConnected()
  });
});

// Existing /api/jobs endpoint
router.use('/jobs', jobsRoutes);

// v1 Namespaced API endpoints
router.use('/v1/jobs', jobsRoutes);
router.use('/v1/services', servicesRoutes);

module.exports = router;
