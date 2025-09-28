'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  name: string;
  totalCarbonSaved: number;
  totalTokens: number;
  totalJourneys: number;
  rank: number;
  avatar?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalJourneys: number;
  totalCarbonSaved: number;
  totalTokensDistributed: number;
}

export const useEcoRideData = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLeaderboard();

      if (response.success && response.data) {
        // Transform backend data to frontend format - data.leaderboard is the array
        const leaderboardEntries = response.data.leaderboard || [];
        const leaderboardData = leaderboardEntries.map((entry: any, index: number) => ({
          id: entry.userId || `user_${index}`,
          userId: entry.userId || `user_${index}`,
          name: entry.name || `User ${index + 1}`,
          totalCarbonSaved: entry.totalCarbonSaved || 0,
          totalTokens: entry.totalTokens || 0,
          totalJourneys: entry.totalJourneys || 0,
          rank: index + 1,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId || index}`,
        }));

        setLeaderboard(leaderboardData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSystemStats = useCallback(async () => {
    try {
      const response = await apiService.getSystemStats();

      if (response.success && response.data) {
        setSystemStats({
          totalUsers: parseInt(response.data.totalUsers) || 0,
          totalJourneys: parseInt(response.data.totalJourneys) || 0,
          totalCarbonSaved: parseFloat(response.data.globalCarbonSaved) || 0,
          totalTokensDistributed: parseFloat(response.data.globalTokensDistributed) || 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system stats');
      console.error('Failed to load system stats:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setError(null);
    await Promise.all([
      loadLeaderboard(),
      loadSystemStats(),
    ]);
  }, [loadLeaderboard, loadSystemStats]);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    leaderboard,
    systemStats,
    isLoading,
    error,
    refreshData,
    loadLeaderboard,
    loadSystemStats,
  };
};