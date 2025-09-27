const express = require('express');
const router = express.Router();
const metroService = require('../services/metro/metroService');
const { validateQRData } = require('../middleware/validation');

// POST /api/metro/scan-qr
router.post('/scan-qr', validateQRData, async (req, res, next) => {
  try {
    const { qrData } = req.body;
    const journeyData = await metroService.parseQRCode(qrData);
    const carbonSavings = await metroService.calculateCarbonSavings(journeyData);

    res.json({
      success: true,
      data: {
        journey: journeyData,
        carbonSavings,
        tokens: carbonSavings.eligibleTokens
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/metro/stations
router.get('/stations', async (req, res, next) => {
  try {
    const stations = await metroService.getAllStations();
    res.json({
      success: true,
      data: stations
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/metro/calculate-carbon
router.post('/calculate-carbon', async (req, res, next) => {
  try {
    const { fromStation, toStation, distance } = req.body;
    const carbonData = await metroService.calculateCarbonSavings({
      fromStation,
      toStation,
      distance
    });

    res.json({
      success: true,
      data: carbonData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;