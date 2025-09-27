const carbonCalculator = require('../carbonCalculator');

const EMISSION_FACTORS = {
  metro: 0.033,
  car: 0.171,
  motorcycle: 0.103,
  auto: 0.145,
  bus: 0.082,
  walking: 0,
  cycling: 0
};

let INITIAL_LEADERBOARD = [];

class CarbonService {
  constructor() {
    this.emissionFactors = EMISSION_FACTORS;
    this.leaderboard = INITIAL_LEADERBOARD;
  }

  async getEmissionFactors() {
    return {
      factors: this.emissionFactors,
      unit: 'kg CO2 per km',
      description: 'Carbon emission factors for different transport modes in Delhi',
      sources: {
        metro: 'Delhi Metro Rail Corporation Environmental Report 2023',
        car: 'Government of India Transport Emission Standards',
        motorcycle: 'ARAI Emission Testing Standards',
        auto: 'Delhi Transport Department Studies',
        bus: 'Delhi Transport Corporation Environmental Data'
      },
      lastUpdated: '2024-09-01'
    };
  }

  async calculateSavings(distance, alternativeMode = 'car') {
    try {
      if (!distance || distance <= 0) {
        throw new Error('Distance must be a positive number');
      }

      if (!this.emissionFactors[alternativeMode]) {
        throw new Error(`Invalid transport mode: ${alternativeMode}`);
      }

      const metroEmission = distance * this.emissionFactors.metro;
      const alternativeEmission = distance * this.emissionFactors[alternativeMode];
      const carbonSaved = Math.max(0, alternativeEmission - metroEmission);

      const treesEquivalent = carbonSaved / 21;

      const fuelSaved = carbonSaved / 2.3;

      const tokenReward = Math.floor(carbonSaved * 10);

      return {
        distance,
        transportModes: {
          metro: {
            emission: Math.round(metroEmission * 1000) / 1000,
            factor: this.emissionFactors.metro
          },
          alternative: {
            mode: alternativeMode,
            emission: Math.round(alternativeEmission * 1000) / 1000,
            factor: this.emissionFactors[alternativeMode]
          }
        },
        carbonSaved: Math.round(carbonSaved * 1000) / 1000,
        environmental: {
          treesEquivalent: Math.round(treesEquivalent * 100) / 100,
          fuelSaved: Math.round(fuelSaved * 100) / 100,
          fuelUnit: 'liters'
        },
        tokenReward,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Carbon calculation failed: ${error.message}`);
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const sortedLeaderboard = [...this.leaderboard]
        .sort((a, b) => b.totalCarbonSaved - a.totalCarbonSaved)
        .slice(0, Math.min(limit, 100))
        .map((entry, index) => ({
          rank: index + 1,
          ...entry,
          avgCarbonPerJourney: Math.round((entry.totalCarbonSaved / entry.journeysCount) * 100) / 100,
          avgTokensPerJourney: Math.round((entry.totalTokensEarned / entry.journeysCount) * 100) / 100
        }));

      return {
        leaderboard: sortedLeaderboard,
        totalEntries: this.leaderboard.length,
        lastUpdated: new Date().toISOString(),
        statistics: {
          totalCarbonSaved: this.leaderboard.reduce((sum, entry) => sum + entry.totalCarbonSaved, 0),
          totalTokensDistributed: this.leaderboard.reduce((sum, entry) => sum + entry.totalTokensEarned, 0),
          totalJourneys: this.leaderboard.reduce((sum, entry) => sum + entry.journeysCount, 0)
        }
      };
    } catch (error) {
      throw new Error(`Leaderboard retrieval failed: ${error.message}`);
    }
  }

  async addUserToLeaderboard(userData) {
    try {
      const newUser = {
        userId: userData.userId || `user_${Date.now()}`,
        name: userData.name || 'Anonymous User',
        totalCarbonSaved: userData.totalCarbonSaved || 0,
        totalTokensEarned: userData.totalTokensEarned || 0,
        journeysCount: userData.journeysCount || 0
      };

      this.leaderboard.push(newUser);
      return newUser;
    } catch (error) {
      throw new Error(`Failed to add user to leaderboard: ${error.message}`);
    }
  }

  async updateUserStats(userId, carbonSaved, tokensEarned) {
    try {
      const userIndex = this.leaderboard.findIndex(user => user.userId === userId);

      if (userIndex !== -1) {
        this.leaderboard[userIndex].totalCarbonSaved += carbonSaved;
        this.leaderboard[userIndex].totalTokensEarned += tokensEarned;
        this.leaderboard[userIndex].journeysCount += 1;
        return this.leaderboard[userIndex];
      } else {
        return await this.addUserToLeaderboard({
          userId,
          name: `User ${userId}`,
          totalCarbonSaved: carbonSaved,
          totalTokensEarned: tokensEarned,
          journeysCount: 1
        });
      }
    } catch (error) {
      throw new Error(`Failed to update user statistics: ${error.message}`);
    }
  }

  async getPlatformStats() {
    try {
      const stats = this.leaderboard.reduce((acc, user) => {
        acc.totalUsers++;
        acc.totalCarbonSaved += user.totalCarbonSaved;
        acc.totalTokensEarned += user.totalTokensEarned;
        acc.totalJourneys += user.journeysCount;
        return acc;
      }, {
        totalUsers: 0,
        totalCarbonSaved: 0,
        totalTokensEarned: 0,
        totalJourneys: 0
      });

      return {
        ...stats,
        avgCarbonPerUser: stats.totalUsers > 0 ? Math.round((stats.totalCarbonSaved / stats.totalUsers) * 100) / 100 : 0,
        avgCarbonPerJourney: stats.totalJourneys > 0 ? Math.round((stats.totalCarbonSaved / stats.totalJourneys) * 100) / 100 : 0,
        treesEquivalent: Math.round((stats.totalCarbonSaved / 21) * 100) / 100,
        lastCalculated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get platform statistics: ${error.message}`);
    }
  }
}

module.exports = new CarbonService();