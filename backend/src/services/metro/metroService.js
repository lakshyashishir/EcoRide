const carbonCalculator = require('../carbonCalculator');
const QrCode = require('qrcode-reader');
const crypto = require('crypto');
const { hederaLogger } = require('../../middleware/logger');

// Delhi Metro stations data
const METRO_STATIONS = {
  'DL001': { name: 'Red Fort', line: 'Red', coordinates: { lat: 28.6562, lng: 77.2410 } },
  'DL002': { name: 'Jama Masjid', line: 'Red', coordinates: { lat: 28.6507, lng: 77.2334 } },
  'DL003': { name: 'Delhi Gate', line: 'Red', coordinates: { lat: 28.6444, lng: 77.2304 } },
  'DL004': { name: 'ITO', line: 'Red', coordinates: { lat: 28.6284, lng: 77.2410 } },
  'DL005': { name: 'Mandi House', line: 'Red', coordinates: { lat: 28.6252, lng: 77.2347 } },
  'DL006': { name: 'Barakhamba Road', line: 'Red', coordinates: { lat: 28.6251, lng: 77.2197 } },
  'DL007': { name: 'Rajiv Chowk', line: 'Red', coordinates: { lat: 28.6328, lng: 77.2197 } },
  'DL008': { name: 'RK Ashram Marg', line: 'Red', coordinates: { lat: 28.6362, lng: 77.2086 } },
  'DL009': { name: 'Jhandewalan', line: 'Red', coordinates: { lat: 28.6448, lng: 77.2000 } },
  'DL010': { name: 'Karol Bagh', line: 'Red', coordinates: { lat: 28.6511, lng: 77.1910 } },
  // Blue Line
  'DL011': { name: 'Dwarka Sector 21', line: 'Blue', coordinates: { lat: 28.5521, lng: 77.0590 } },
  'DL012': { name: 'Dwarka Sector 8', line: 'Blue', coordinates: { lat: 28.5702, lng: 77.0707 } },
  'DL013': { name: 'Dwarka Sector 9', line: 'Blue', coordinates: { lat: 28.5751, lng: 77.0775 } },
  'DL014': { name: 'Dwarka Sector 10', line: 'Blue', coordinates: { lat: 28.5800, lng: 77.0843 } },
  'DL015': { name: 'Dwarka Sector 11', line: 'Blue', coordinates: { lat: 28.5849, lng: 77.0911 } },
  // Yellow Line
  'DL016': { name: 'AIIMS', line: 'Yellow', coordinates: { lat: 28.5677, lng: 77.2077 } },
  'DL017': { name: 'Hauz Khas', line: 'Yellow', coordinates: { lat: 28.5494, lng: 77.2063 } }
};

class MetroService {
  constructor() {
    this.stations = METRO_STATIONS;
    this.processedQRCodes = new Map(); // Cache for preventing duplicate submissions
    this.qrReader = new QrCode();
    this.validationCache = new Map(); // Cache for QR validation results
  }

  /**
   * Parse and validate QR code data from Delhi Metro ticket
   * Supports multiple QR formats and includes comprehensive validation
   */
  async parseQRCode(qrData, imageBuffer = null) {
    try {
      hederaLogger.info('Starting QR code parsing', { qrDataLength: qrData?.length });

      let parsedData;

      // If image buffer is provided, decode QR from image
      if (imageBuffer) {
        parsedData = await this.parseQRFromImage(imageBuffer);
      } else if (typeof qrData === 'string') {
        parsedData = qrData;
      } else {
        throw new Error('Invalid QR data format - must be string or image buffer');
      }

      // Validate QR code format and authenticity
      await this.validateQRCode(parsedData);

      // Parse different QR formats
      const journeyData = await this.parseQRFormat(parsedData);

      // Additional validation
      await this.validateJourneyData(journeyData);

      // Check for duplicate submissions
      await this.checkDuplicateSubmission(journeyData);

      // Generate unique journey ID
      journeyData.journeyId = this.generateJourneyId(journeyData);
      journeyData.qrCodeHash = this.generateQRHash(parsedData);

      hederaLogger.info('QR code parsed successfully', {
        journeyId: journeyData.journeyId,
        fromStation: journeyData.fromStation.name,
        toStation: journeyData.toStation.name,
        distance: journeyData.distance
      });

      return journeyData;
    } catch (error) {
      hederaLogger.error('QR code parsing failed', error, { qrData: qrData?.substring(0, 100) });
      throw new Error(`Failed to parse QR code: ${error.message}`);
    }
  }

  /**
   * Parse QR code from image buffer
   */
  async parseQRFromImage(imageBuffer) {
    return new Promise((resolve, reject) => {
      try {
        this.qrReader.callback = (err, value) => {
          if (err) {
            reject(new Error(`QR image decoding failed: ${err.message}`));
            return;
          }
          resolve(value.result);
        };

        // Decode QR from image buffer
        this.qrReader.decode(imageBuffer);
      } catch (error) {
        reject(new Error(`QR image processing failed: ${error.message}`));
      }
    });
  }

  /**
   * Validate QR code authenticity and format
   */
  async validateQRCode(qrData) {
    if (!qrData || typeof qrData !== 'string') {
      throw new Error('QR data must be a non-empty string');
    }

    // Check for minimum and maximum length
    if (qrData.length < 10 || qrData.length > 500) {
      throw new Error('QR data length is invalid');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /eval\(/i,
      /document\./i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(qrData))) {
      throw new Error('QR data contains suspicious content');
    }

    // Validate timestamp if present
    const timestampMatch = qrData.match(/TIME:(.+)$/);
    if (timestampMatch) {
      const timestamp = new Date(timestampMatch[1]);
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (isNaN(timestamp.getTime())) {
        throw new Error('Invalid timestamp format in QR data');
      }

      if (now - timestamp > maxAge) {
        throw new Error('QR code has expired (older than 24 hours)');
      }

      if (timestamp > now) {
        throw new Error('QR code timestamp is in the future');
      }
    }
  }

  /**
   * Parse different QR code formats
   */
  async parseQRFormat(qrData) {
    // Format 1: DLMETRO format
    if (qrData.startsWith('DLMETRO:')) {
      return await this.parseDLMETROFormat(qrData);
    }

    // Format 2: JSON format
    if (qrData.startsWith('{') && qrData.endsWith('}')) {
      return await this.parseJSONFormat(qrData);
    }

    // Format 3: Base64 encoded format
    if (/^[A-Za-z0-9+/]+=*$/.test(qrData)) {
      try {
        const decoded = Buffer.from(qrData, 'base64').toString('utf8');
        return await this.parseQRFormat(decoded);
      } catch (error) {
        // Not a valid base64, continue with other formats
      }
    }

    // Format 4: URL format (for web-based tickets)
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      return await this.parseURLFormat(qrData);
    }

    throw new Error('Unsupported QR code format');
  }

  /**
   * Parse DLMETRO format QR code
   */
  async parseDLMETROFormat(qrData) {
    const parts = qrData.split(':');
    if (parts.length < 8) {
      throw new Error('Incomplete DLMETRO QR code data');
    }

    const [, , fromStationId, , toStationId, , fare] = parts;
    // Extract timestamp from the original string after TIME:
    const timestampMatch = qrData.match(/TIME:(.+)$/);
    const timestamp = timestampMatch ? timestampMatch[1] : parts[8];

    const fromStation = this.stations[fromStationId];
    const toStation = this.stations[toStationId];

    if (!fromStation || !toStation) {
      throw new Error(`Invalid station codes: ${fromStationId}, ${toStationId}`);
    }

    const distance = this.calculateDistance(fromStation.coordinates, toStation.coordinates);

    return {
      fromStation: {
        id: fromStationId,
        ...fromStation
      },
      toStation: {
        id: toStationId,
        ...toStation
      },
      distance: Math.round(distance * 1000), // Convert to meters and round
      fare: parseInt(fare),
      timestamp: new Date(timestamp),
      format: 'DLMETRO'
    };
  }

  /**
   * Parse JSON format QR code
   */
  async parseJSONFormat(qrData) {
    try {
      const data = JSON.parse(qrData);

      if (!data.from || !data.to || !data.timestamp) {
        throw new Error('Missing required fields in JSON QR data');
      }

      const fromStation = this.findStationByName(data.from);
      const toStation = this.findStationByName(data.to);

      if (!fromStation || !toStation) {
        throw new Error(`Station not found: ${data.from} or ${data.to}`);
      }

      const distance = data.distance || this.calculateDistance(fromStation.coordinates, toStation.coordinates);

      return {
        fromStation,
        toStation,
        distance: Math.round(distance * 1000), // Convert to meters
        fare: data.fare || 0,
        timestamp: new Date(data.timestamp),
        format: 'JSON'
      };
    } catch (error) {
      throw new Error(`Invalid JSON QR format: ${error.message}`);
    }
  }

  /**
   * Parse URL format QR code
   */
  async parseURLFormat(qrData) {
    try {
      const url = new URL(qrData);
      const params = url.searchParams;

      const fromStationName = params.get('from');
      const toStationName = params.get('to');
      const timestamp = params.get('time');

      if (!fromStationName || !toStationName || !timestamp) {
        throw new Error('Missing required parameters in URL QR code');
      }

      const fromStation = this.findStationByName(fromStationName);
      const toStation = this.findStationByName(toStationName);

      if (!fromStation || !toStation) {
        throw new Error(`Station not found: ${fromStationName} or ${toStationName}`);
      }

      const distance = this.calculateDistance(fromStation.coordinates, toStation.coordinates);

      return {
        fromStation,
        toStation,
        distance: Math.round(distance * 1000), // Convert to meters
        fare: parseInt(params.get('fare')) || 0,
        timestamp: new Date(timestamp),
        format: 'URL'
      };
    } catch (error) {
      throw new Error(`Invalid URL QR format: ${error.message}`);
    }
  }

  /**
   * Validate parsed journey data
   */
  async validateJourneyData(journeyData) {
    // Validate stations
    if (!journeyData.fromStation || !journeyData.toStation) {
      throw new Error('Invalid station data');
    }

    // Check if stations are different
    if (journeyData.fromStation.id === journeyData.toStation.id) {
      throw new Error('Origin and destination stations cannot be the same');
    }

    // Validate distance
    if (!journeyData.distance || journeyData.distance <= 0) {
      throw new Error('Invalid journey distance');
    }

    // Check maximum reasonable distance (Delhi Metro network spans ~350km)
    if (journeyData.distance > 350000) { // 350km in meters
      throw new Error('Journey distance exceeds maximum Metro network distance');
    }

    // Validate timestamp
    if (!journeyData.timestamp || isNaN(journeyData.timestamp.getTime())) {
      throw new Error('Invalid journey timestamp');
    }

    // Check if journey is recent (within last 24 hours)
    const now = new Date();
    const timeDiff = now - journeyData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (timeDiff > maxAge) {
      throw new Error('Journey is too old (older than 24 hours)');
    }

    if (timeDiff < 0) {
      throw new Error('Journey timestamp is in the future');
    }
  }

  /**
   * Check for duplicate QR code submissions
   */
  async checkDuplicateSubmission(journeyData) {
    const qrHash = this.generateQRHash(JSON.stringify(journeyData));

    if (this.processedQRCodes.has(qrHash)) {
      const previousSubmission = this.processedQRCodes.get(qrHash);
      throw new Error(`QR code already processed at ${previousSubmission.processedAt}`);
    }

    // Store QR hash with timestamp
    this.processedQRCodes.set(qrHash, {
      processedAt: new Date().toISOString(),
      journeyId: journeyData.journeyId
    });

    // Clean up entries older than 24 hours
    this.cleanupProcessedQRCodes();
  }

  /**
   * Generate unique journey ID
   */
  generateJourneyId(journeyData) {
    const timestamp = journeyData.timestamp.getTime();
    const stationIds = `${journeyData.fromStation.id}_${journeyData.toStation.id}`;
    const random = Math.random().toString(36).substr(2, 9);
    return `journey_${timestamp}_${stationIds}_${random}`;
  }

  /**
   * Generate QR code hash for duplicate prevention
   */
  generateQRHash(qrData) {
    return crypto.createHash('sha256').update(qrData).digest('hex');
  }

  /**
   * Find station by name (case-insensitive)
   */
  findStationByName(stationName) {
    const normalizedName = stationName.toLowerCase().trim();

    for (const [id, station] of Object.entries(this.stations)) {
      if (station.name.toLowerCase() === normalizedName) {
        return { id, ...station };
      }
    }

    return null;
  }

  /**
   * Clean up processed QR codes older than 24 hours
   */
  cleanupProcessedQRCodes() {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    for (const [hash, data] of this.processedQRCodes.entries()) {
      if (new Date(data.processedAt) < cutoffTime) {
        this.processedQRCodes.delete(hash);
      }
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const lat1 = this.toRad(coord1.lat);
    const lat2 = this.toRad(coord2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI/180);
  }

  // Calculate carbon savings for a metro journey
  async calculateCarbonSavings(journeyData) {
    try {
      const { distance, fromStation, toStation } = journeyData;

      // Use carbon calculator service (distance in meters, convert to grams)
      const carbonData = carbonCalculator.calculateCarbonSaved(distance, 'car');

      // Calculate eligible token amount based on carbon savings (convert grams to kg)
      const carbonSavedKg = carbonData.carbonSaved / 1000;
      const eligibleTokens = Math.floor(carbonSavedKg * 10); // 10 tokens per kg CO2 saved

      return {
        carbonSaved: carbonSavedKg,
        carbonSavedGrams: carbonData.carbonSaved,
        metroEmissions: carbonData.metroEmissions / 1000, // Convert to kg
        alternativeEmissions: carbonData.alternativeEmissions / 1000, // Convert to kg
        savingsPercentage: carbonData.savingsPercentage,
        eligibleTokens,
        journey: {
          from: fromStation.name,
          to: toStation.name,
          distance,
          distanceKm: distance / 1000,
          line: fromStation.line
        }
      };
    } catch (error) {
      throw new Error(`Failed to calculate carbon savings: ${error.message}`);
    }
  }

  // Get all available metro stations
  async getAllStations() {
    return Object.entries(this.stations).map(([id, station]) => ({
      id,
      ...station
    }));
  }

}

module.exports = new MetroService();