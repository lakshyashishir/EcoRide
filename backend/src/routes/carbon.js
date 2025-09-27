const express = require('express');
const router = express.Router();
const carbonService = require('../services/carbon/carbonService');

// GET /api/carbon/factors
router.get('/factors', async (req, res, next) => {
  try {
    const factors = await carbonService.getEmissionFactors();
    res.json({
      success: true,
      data: factors
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/carbon/calculate
router.post('/calculate', async (req, res, next) => {
  try {
    const { distance, transportMode = 'metro' } = req.body;
    const carbonData = await carbonService.calculateSavings(distance, transportMode);

    res.json({
      success: true,
      data: carbonData
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/carbon/leaderboard
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await carbonService.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;