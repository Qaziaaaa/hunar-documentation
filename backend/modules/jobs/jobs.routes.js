const express = require('express');
const jobsService = require('./jobs.service');

const router = express.Router();

// Matches both /api/jobs and /api/v1/jobs
router.get('/', async (req, res, next) => {
  try {
    const jobs = await jobsService.getJobs();
    res.json({ jobs: jobs });
  } catch (err) {
    if (err.message.includes('not connected')) {
      return res.status(503).json({ error: err.message });
    }
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const arr = Array.isArray(req.body) ? req.body : (req.body && req.body.jobs) || [];
    const count = await jobsService.saveJobs(arr);
    res.json({ ok: true, count: count });
  } catch (err) {
    if (err.message.includes('not connected')) {
      return res.status(503).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
