class CarbonCalculator {
    constructor() {
        this.emissionFactors = {
            car: 171,
            motorcycle: 95,
            auto: 150,
            bus: 89,
            metro: 17
        };

        this.defaultComparison = 'car';

        this.metroEfficiency = {
            energyPerKm: 0.15,
            carbonIntensity: 0.82,
            loadFactor: 0.65
        };
    }

    calculateCarbonSaved(distance, alternativeMode = this.defaultComparison) {
        const distanceKm = distance / 1000;

        const metroEmissions = this.calculateMetroEmissions(distanceKm);

        const alternativeEmissions = this.calculateAlternativeEmissions(
            distanceKm,
            alternativeMode
        );

        const carbonSaved = Math.max(0, alternativeEmissions - metroEmissions);

        return {
            distance: distance,
            distanceKm: distanceKm,
            metroEmissions: Math.round(metroEmissions),
            alternativeEmissions: Math.round(alternativeEmissions),
            carbonSaved: Math.round(carbonSaved),
            alternativeMode: alternativeMode,
            savingsPercentage: alternativeEmissions > 0
                ? Math.round((carbonSaved / alternativeEmissions) * 100)
                : 0
        };
    }

    calculateMetroEmissions(distanceKm) {
        return distanceKm * this.emissionFactors.metro;
    }

    calculateAlternativeEmissions(distanceKm, mode) {
        const factor = this.emissionFactors[mode] || this.emissionFactors.car;
        return distanceKm * factor;
    }

    calculateTokenReward(carbonSaved, multiplier = 10) {
        const baseReward = (carbonSaved * multiplier) / 1000;
        const rewardWithDecimals = Math.floor(baseReward * Math.pow(10, 18));

        return {
            carbonSaved: carbonSaved,
            baseReward: baseReward,
            tokensWithDecimals: rewardWithDecimals.toString(),
            tokensForDisplay: baseReward.toFixed(2),
            multiplier: multiplier
        };
    }

    validateJourneyData(journeyData) {
        const errors = [];

        if (!journeyData.distance || journeyData.distance <= 0) {
            errors.push('Distance must be a positive number');
        }

        if (journeyData.distance > 100000) {
            errors.push('Distance seems too large for metro journey');
        }

        if (!journeyData.fromStation || !journeyData.toStation) {
            errors.push('From and to stations are required');
        }

        if (journeyData.fromStation === journeyData.toStation) {
            errors.push('From and to stations cannot be the same');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    getStationDistance(fromStation, toStation) {
        // Calculate distance based on station coordinates or estimate
        return this.estimateDistance(fromStation, toStation);
    }

    estimateDistance(fromStation, toStation) {
        const avgStationDistance = 1500;
        const stationCount = Math.abs(fromStation.length - toStation.length) + 1;
        return stationCount * avgStationDistance;
    }

    processJourneyData(qrData) {
        const validation = this.validateJourneyData(qrData);
        if (!validation.isValid) {
            throw new Error(`Invalid journey data: ${validation.errors.join(', ')}`);
        }

        const distance = qrData.distance || this.getStationDistance(
            qrData.fromStation,
            qrData.toStation
        );

        const carbonAnalysis = this.calculateCarbonSaved(distance, qrData.alternativeMode);

        const tokenRewards = this.calculateTokenReward(carbonAnalysis.carbonSaved);

        return {
            journeyId: qrData.journeyId || this.generateJourneyId(),
            timestamp: new Date().toISOString(),
            fromStation: qrData.fromStation,
            toStation: qrData.toStation,
            distance: distance,
            carbonAnalysis: carbonAnalysis,
            tokenRewards: tokenRewards,
            metadata: {
                qrCodeData: qrData,
                calculationMethod: 'EcoRide v1.0',
                emissionFactors: this.emissionFactors
            }
        };
    }

    generateJourneyId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `MGJ_${timestamp}_${random}`;
    }

    getMonthlyStats(journeys) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyJourneys = journeys.filter(journey => {
            const journeyDate = new Date(journey.timestamp);
            return journeyDate.getMonth() === currentMonth &&
                   journeyDate.getFullYear() === currentYear;
        });

        const totalCarbonSaved = monthlyJourneys.reduce(
            (sum, journey) => sum + (journey.carbonAnalysis?.carbonSaved || 0), 0
        );

        const totalTokensEarned = monthlyJourneys.reduce(
            (sum, journey) => sum + parseFloat(journey.tokenRewards?.tokensForDisplay || 0), 0
        );

        const totalDistance = monthlyJourneys.reduce(
            (sum, journey) => sum + (journey.distance || 0), 0
        );

        return {
            month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            totalJourneys: monthlyJourneys.length,
            totalDistance: totalDistance,
            totalCarbonSaved: Math.round(totalCarbonSaved),
            totalTokensEarned: totalTokensEarned.toFixed(2),
            averageCarbonPerJourney: monthlyJourneys.length > 0
                ? Math.round(totalCarbonSaved / monthlyJourneys.length)
                : 0,
            carbonEquivalent: this.getCarbonEquivalent(totalCarbonSaved)
        };
    }

    getCarbonEquivalent(carbonGrams) {
        const carbonKg = carbonGrams / 1000;

        return {
            treesPlanted: (carbonKg / 21.77).toFixed(2),
            kmDriving: (carbonKg / 0.171).toFixed(1),
            phoneCharges: Math.round(carbonKg / 0.008),
            plasticBottles: Math.round(carbonKg / 0.082)
        };
    }
}

module.exports = new CarbonCalculator();