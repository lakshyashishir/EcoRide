// Carbon emission factors for Delhi transport modes (g CO2 per km)
export const EMISSION_FACTORS = {
    metro: 33,      // Delhi Metro (clean electricity mix)
    car: 171,       // Average car in Delhi
    auto: 145,      // Auto-rickshaw
    motorcycle: 89, // Motorcycle/scooter
    bus: 82,        // Delhi public bus
  } as const;
  
  export type TransportMode = keyof typeof EMISSION_FACTORS;
  
  export interface CarbonCalculation {
    distance: number;
    metroEmissions: number;
    alternativeEmissions: number;
    carbonSaved: number;
    carbonSavedPercentage: number;
    alternativeMode: TransportMode;
    tokensEarned: number;
    equivalentTrees: number;
    equivalentCarKm: number;
  }
  
  // Token earning rate: 10 tokens per kg CO2 saved
  export const TOKEN_RATE_PER_KG = 10;
  
  // Environmental equivalencies
  export const TREE_CO2_ABSORPTION_PER_YEAR = 22; // kg CO2 per tree per year
  export const CAR_AVERAGE_EMISSION = 4600; // kg CO2 per year for average car
  
  /**
   * Calculate carbon savings for a metro journey vs alternative transport
   */
  export function calculateCarbonSavings(
    distanceKm: number,
    alternativeMode: TransportMode = 'car'
  ): CarbonCalculation {
    if (distanceKm <= 0) {
      throw new Error('Distance must be positive');
    }
  
    if (alternativeMode === 'metro') {
      throw new Error('Alternative mode cannot be metro');
    }
  
    const metroEmissions = (distanceKm * EMISSION_FACTORS.metro) / 1000; // Convert to kg
    const alternativeEmissions = (distanceKm * EMISSION_FACTORS[alternativeMode]) / 1000; // Convert to kg
    const carbonSaved = alternativeEmissions - metroEmissions;
    const carbonSavedPercentage = (carbonSaved / alternativeEmissions) * 100;
    const tokensEarned = carbonSaved * TOKEN_RATE_PER_KG;
  
    // Environmental equivalencies
    const equivalentTrees = carbonSaved / (TREE_CO2_ABSORPTION_PER_YEAR / 365); // Trees per day equivalent
    const equivalentCarKm = (carbonSaved * 1000) / EMISSION_FACTORS.car; // Equivalent car km avoided
  
    return {
      distance: distanceKm,
      metroEmissions,
      alternativeEmissions,
      carbonSaved,
      carbonSavedPercentage,
      alternativeMode,
      tokensEarned,
      equivalentTrees,
      equivalentCarKm,
    };
  }
  
  /**
   * Calculate total carbon impact for multiple journeys
   */
  export function calculateTotalImpact(journeys: Array<{ distance: number; carbonSaved: number }>) {
    const totalDistance = journeys.reduce((sum, journey) => sum + journey.distance, 0);
    const totalCarbonSaved = journeys.reduce((sum, journey) => sum + journey.carbonSaved, 0);
    const totalTokensEarned = totalCarbonSaved * TOKEN_RATE_PER_KG;
  
    // Annual equivalencies
    const annualTreesEquivalent = totalCarbonSaved / TREE_CO2_ABSORPTION_PER_YEAR;
    const annualCarPercentage = (totalCarbonSaved / CAR_AVERAGE_EMISSION) * 100;
  
    return {
      totalJourneys: journeys.length,
      totalDistance,
      totalCarbonSaved,
      totalTokensEarned,
      annualTreesEquivalent,
      annualCarPercentage,
      averagePerJourney: {
        distance: totalDistance / journeys.length || 0,
        carbonSaved: totalCarbonSaved / journeys.length || 0,
        tokensEarned: totalTokensEarned / journeys.length || 0,
      },
    };
  }
  
  /**
   * Get carbon intensity comparison for different transport modes
   */
  export function getTransportComparison(distanceKm: number) {
    return Object.entries(EMISSION_FACTORS).map(([mode, factor]) => ({
      mode: mode as TransportMode,
      emissions: (distanceKm * factor) / 1000, // kg CO2
      emissionsPerKm: factor / 1000, // kg CO2 per km
      savingsVsMetro: mode !== 'metro' ? ((factor - EMISSION_FACTORS.metro) / 1000) * distanceKm : 0,
    }));
  }
  
  /**
   * Format carbon amount for display
   */
  export function formatCarbonAmount(kg: number): string {
    if (kg < 0.001) {
      return `${(kg * 1000000).toFixed(0)}mg`;
    } else if (kg < 1) {
      return `${(kg * 1000).toFixed(0)}g`;
    } else if (kg < 1000) {
      return `${kg.toFixed(2)}kg`;
    } else {
      return `${(kg / 1000).toFixed(2)}t`;
    }
  }
  
  /**
   * Format token amount for display
   */
  export function formatTokenAmount(tokens: number): string {
    if (tokens < 1) {
      return tokens.toFixed(3);
    } else if (tokens < 1000) {
      return tokens.toFixed(2);
    } else if (tokens < 1000000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    } else {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
  }
  
  /**
   * Get carbon savings tier and badge
   */
  export function getCarbonTier(totalCarbonSaved: number) {
    if (totalCarbonSaved < 1) {
      return { tier: 'Bronze', color: '#cd7f32', minThreshold: 0 };
    } else if (totalCarbonSaved < 5) {
      return { tier: 'Silver', color: '#c0c0c0', minThreshold: 1 };
    } else if (totalCarbonSaved < 10) {
      return { tier: 'Gold', color: '#ffd700', minThreshold: 5 };
    } else if (totalCarbonSaved < 25) {
      return { tier: 'Platinum', color: '#e5e4e2', minThreshold: 10 };
    } else {
      return { tier: 'Diamond', color: '#b9f2ff', minThreshold: 25 };
    }
  }
  
  /**
   * Calculate progress to next tier
   */
  export function getTierProgress(totalCarbonSaved: number) {
    const currentTier = getCarbonTier(totalCarbonSaved);
    const nextTiers = [
      { tier: 'Bronze', threshold: 0 },
      { tier: 'Silver', threshold: 1 },
      { tier: 'Gold', threshold: 5 },
      { tier: 'Platinum', threshold: 10 },
      { tier: 'Diamond', threshold: 25 },
    ];
  
    const currentIndex = nextTiers.findIndex(t => t.tier === currentTier.tier);
    const nextTier = nextTiers[currentIndex + 1];
  
    if (!nextTier) {
      return { isMaxTier: true, progress: 100, nextTier: null, remaining: 0 };
    }
  
    const progress = ((totalCarbonSaved - currentTier.minThreshold) / (nextTier.threshold - currentTier.minThreshold)) * 100;
    const remaining = nextTier.threshold - totalCarbonSaved;
  
    return {
      isMaxTier: false,
      progress: Math.min(progress, 100),
      nextTier: nextTier.tier,
      remaining: Math.max(remaining, 0),
    };
  }
  
  /**
   * Get personalized insights based on carbon savings
   */
  export function getCarbonInsights(totalCarbonSaved: number, totalJourneys: number) {
    const insights = [];
  
    const avgPerJourney = totalCarbonSaved / totalJourneys || 0;
    if (avgPerJourney > 0.5) {
      insights.push({
        type: 'achievement',
        message: `Excellent! You're saving ${formatCarbonAmount(avgPerJourney)} per journey on average.`,
      });
    }
  
    const annualProjection = totalCarbonSaved * (365 / Math.max(totalJourneys, 1));
    if (annualProjection > 50) {
      insights.push({
        type: 'projection',
        message: `At this rate, you'll save ${formatCarbonAmount(annualProjection)} of CO₂ annually!`,
      });
    }
  
    const treesEquivalent = totalCarbonSaved / TREE_CO2_ABSORPTION_PER_YEAR;
    if (treesEquivalent > 0.1) {
      insights.push({
        type: 'environment',
        message: `Your metro usage is equivalent to ${treesEquivalent.toFixed(1)} trees working for a year!`,
      });
    }
  
    return insights;
  }