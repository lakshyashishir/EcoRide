const express = require('express');
const router = express.Router();
const metroService = require('../services/metro/metroService');
const { validateQRData } = require('../middleware/validation');

// POST /api/metro/scan-qr
router.post('/scan-qr', validateQRData, async (req, res, next) => {
  try {
    const { qrData, journeyData } = req.body;

    // Simple validation
    if (!qrData || typeof qrData !== 'string' || qrData.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code format'
      });
    }

    // Use journey data provided by frontend or generate default
    const processedJourneyData = journeyData || {
      fromStation: { name: 'Rajiv Chowk', id: 'DL007' },
      toStation: { name: 'Red Fort', id: 'DL001' },
      distance: 3330,
      fare: 25,
      timestamp: new Date(),
      qrHash: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const carbonSavings = await metroService.calculateCarbonSavings(processedJourneyData);

    res.json({
      success: true,
      data: {
        journey: processedJourneyData,
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