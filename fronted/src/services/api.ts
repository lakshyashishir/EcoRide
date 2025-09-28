/**
 * EcoRide API Service
 * Handles all communication between frontend and backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

interface JourneyData {
  journeyId: string;
  fromStation: string;
  toStation: string;
  distance: number;
  carbonSaved: number;
  userAddress: string;
  journeyTimestamp?: string;
}

interface QRScanData {
  qrData: string;
}

interface CarbonCalculationData {
  fromStation: string;
  toStation: string;
  distance: number;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors with details
        if (data.error === 'Validation failed' && data.details) {
          const validationMessages = data.details.map((detail: any) => detail.msg).join(', ');
          throw new Error(`Validation failed: ${validationMessages}`);
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Health checks
  async checkBackendHealth() {
    return this.makeRequest('/health');
  }

  async checkHederaHealth() {
    return this.makeRequest('/api/hedera/health');
  }

  // Metro API endpoints
  async scanQRCode(qrData: string, journeyData?: any) {
    return this.makeRequest<any>('/api/metro/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ qrData, journeyData }),
    });
  }

  async getMetroStations() {
    return this.makeRequest<any>('/api/metro/stations');
  }

  async calculateCarbon(data: CarbonCalculationData) {
    return this.makeRequest<any>('/api/metro/calculate-carbon', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Hedera API endpoints
  async submitJourney(journey: JourneyData) {
    return this.makeRequest<any>('/api/hedera/journey', {
      method: 'POST',
      body: JSON.stringify(journey),
    });
  }

  async setupHedera() {
    return this.makeRequest<any>('/api/hedera/setup', {
      method: 'POST',
    });
  }

  async getUserStats(userAddress: string) {
    return this.makeRequest<any>(`/api/hedera/stats/${userAddress}`);
  }

  async getGlobalStats() {
    return this.makeRequest<any>('/api/hedera/stats/global');
  }

  async getLeaderboard() {
    return this.makeRequest<any>('/api/carbon/leaderboard');
  }

  async getUserJourneys(userAddress: string) {
    return this.makeRequest<any>(`/api/carbon/user/${userAddress}/journeys`);
  }

  async getUserStats(userId: string) {
    return this.makeRequest<any>(`/api/hedera/analytics/user/${userId}`);
  }

  async getSystemStats() {
    return this.makeRequest<any>('/api/hedera/analytics/system');
  }

  async getTopicMessages(limit = 25) {
    return this.makeRequest<any>(`/api/hedera/topic/messages?limit=${limit}&order=desc`);
  }

  async getUserTokenTransfers(accountId: string, limit = 25) {
    return this.makeRequest<any>(`/api/hedera/mirror/token-transfers/${accountId}?limit=${limit}`);
  }

  // Token operations
  async getTokenBalance(accountId: string) {
    return this.makeRequest<any>(`/api/hedera/token/balance/${accountId}`);
  }

  async getTokenAssociation(accountId: string) {
    return this.makeRequest<any>(`/api/hedera/token/association/${accountId}`);
  }

  async associateToken(accountId: string) {
    return this.makeRequest<any>('/api/hedera/associate-token', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
  }

  // Merchant operations
  async processMerchantPayment(data: {
    userAddress: string;
    merchantAddress: string;
    amount: number;
    description: string;
  }) {
    return this.makeRequest<any>('/api/hedera/merchant-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;