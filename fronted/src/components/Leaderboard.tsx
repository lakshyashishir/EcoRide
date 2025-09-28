'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Coins,
  Leaf,
  Crown,
  Star,
  Users,
  Calendar,
  Target,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { useEcoRideData } from '@/hooks/useEcoRideData';
import { formatCarbonAmount, formatTokenAmount, getCarbonTier, getTierProgress } from '@/utils/carbonCalculator';

interface LeaderboardEntry {
  id: string;
  accountId: string;
  displayName: string;
  carbonSaved: number;
  tokensEarned: number;
  journeys: number;
  tier: string;
  isCurrentUser?: boolean;
  avatar?: string;
}

interface LeaderboardProps {
  className?: string;
  period?: 'weekly' | 'monthly' | 'allTime';
  maxEntries?: number;
}

// Fallback when no leaderboard data is available - minimal placeholder
const getEmptyLeaderboard = (currentUserAccountId?: string): LeaderboardEntry[] => {
  if (!currentUserAccountId) return [];

  return [{
    id: 'current_user_only',
    accountId: currentUserAccountId,
    displayName: 'You',
    carbonSaved: 0,
    tokensEarned: 0,
    journeys: 0,
    tier: getCarbonTier(0).tier,
    isCurrentUser: true,
  }];
};

interface LeaderboardPageProps extends LeaderboardProps {
  onNavigate?: (section: string) => void;
}

export default function Leaderboard({
  className = '',
  period = 'allTime',
  maxEntries = 10,
  onNavigate,
}: LeaderboardPageProps) {
  const { wallet, totalCarbonSaved, totalTokens, totalJourneys, isConnected } = useHedera();
  const { leaderboard, systemStats, isLoading, error, refreshData } = useEcoRideData();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'allTime'>(period);

  const leaderboardData = useMemo(() => {
    // Use real leaderboard data if available
    if (leaderboard && leaderboard.length > 0) {
      const realData = leaderboard.slice(0, maxEntries).map((entry) => ({
        id: entry.id,
        accountId: entry.userId,
        displayName: entry.name,
        carbonSaved: entry.totalCarbonSaved,
        tokensEarned: entry.totalTokens,
        journeys: entry.totalJourneys,
        tier: getCarbonTier(entry.totalCarbonSaved).tier,
        isCurrentUser: isConnected && entry.userId === wallet.accountId,
        avatar: entry.avatar,
      }));

      // If current user is connected but not in leaderboard, add them
      if (isConnected && totalCarbonSaved > 0) {
        const userInLeaderboard = realData.some(entry => entry.accountId === wallet.accountId);
        if (!userInLeaderboard) {
          const userEntry: LeaderboardEntry = {
            id: 'current_user',
            accountId: wallet.accountId,
            displayName: 'You',
            carbonSaved: totalCarbonSaved,
            tokensEarned: totalTokens,
            journeys: totalJourneys,
            tier: getCarbonTier(totalCarbonSaved).tier,
            isCurrentUser: true,
          };
          realData.push(userEntry);
          // Sort by carbon saved descending
          realData.sort((a, b) => b.carbonSaved - a.carbonSaved);
        }
      }

      return realData.slice(0, maxEntries);
    }

    // If no leaderboard data and user is connected, show just the user
    if (isConnected && (totalCarbonSaved > 0 || totalJourneys > 0)) {
      return [{
        id: 'current_user_only',
        accountId: wallet.accountId,
        displayName: 'You',
        carbonSaved: totalCarbonSaved,
        tokensEarned: totalTokens,
        journeys: totalJourneys,
        tier: getCarbonTier(totalCarbonSaved).tier,
        isCurrentUser: true,
      }];
    }

    // Fallback to empty state
    return getEmptyLeaderboard(isConnected ? wallet.accountId : undefined);
  }, [leaderboard, isConnected, wallet.accountId, totalCarbonSaved, totalTokens, totalJourneys, maxEntries]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond':
        return 'bg-blue-100 text-blue-800';
      case 'platinum':
        return 'bg-slate-100 text-slate-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'bronze':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const periodLabels = {
    weekly: 'This Week',
    monthly: 'This Month',
    allTime: 'All Time',
  };

 

  return (
    <div className={`grid lg:grid-cols-4 gap-6 ${className}`}>
     
      <div className="lg:col-span-1 space-y-6">
      
        <Card className="border-primary bg-primary/5 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              {formatTokenAmount(totalTokens)} GREEN
            </h2>
            <p className="text-muted-foreground mb-4">Available to redeem</p>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onNavigate && onNavigate('home')}
            >
              Earn More Tokens
            </Button>
          </CardContent>
        </Card>

       
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-600" />
              Your Carbon Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const currentTier = getCarbonTier(totalCarbonSaved);
              const tierProgress = getTierProgress(totalCarbonSaved);

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Badge className={getTierBadgeColor(currentTier.tier)}>
                      {currentTier.tier}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {tierProgress.isMaxTier
                        ? 'Max tier achieved!'
                        : `${formatCarbonAmount(tierProgress.remaining)} to ${tierProgress.nextTier}`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${tierProgress.progress}%` }}
                    ></div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{formatCarbonAmount(totalCarbonSaved)} CO₂ saved total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{totalJourneys} eco-friendly journeys</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

       
        <Card className="shadow-lg border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-800">Quick Redeem</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Use your tokens at 50+ partner stores near metro stations
            </p>
            <Button
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => onNavigate && onNavigate('rewards')}
            >
              View All Offers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

     
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Eco-Commuter Leaderboard
                </CardTitle>
                <CardDescription>
                  Top performers in sustainable transportation
                </CardDescription>
              </div>

          <div className="flex items-center gap-2">
            {Object.entries(periodLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedPeriod === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(key as 'weekly' | 'monthly' | 'allTime')}
                className={selectedPeriod === key ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
       
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {leaderboardData.slice(0, 3).map((entry, index) => {
              const actualRank = index + 1;
              const podiumOrder = [1, 0, 2]; // Second, First, Third
              const podiumIndex = podiumOrder.indexOf(index);
              const heights = ['h-16', 'h-20', 'h-12'];

              return (
                <div
                  key={entry.id}
                  className={`text-center ${podiumIndex === 1 ? 'order-2' : podiumIndex === 0 ? 'order-1' : 'order-3'}`}
                >
                  <div className={`${heights[podiumIndex]} bg-gradient-to-t ${
                    actualRank === 1 ? 'from-yellow-400 to-yellow-300' :
                    actualRank === 2 ? 'from-gray-300 to-gray-200' :
                    'from-amber-400 to-amber-300'
                  } rounded-t-lg flex items-end justify-center mb-2`}>
                    <div className="text-white font-bold text-lg mb-2">#{actualRank}</div>
                  </div>

                  <div className={`p-3 rounded-lg ${entry.isCurrentUser ? 'bg-green-100 border-2 border-green-300' : 'bg-white border border-gray-200'}`}>
                    <div className="flex justify-center mb-2">
                      {getRankIcon(actualRank)}
                    </div>
                    <p className={`font-medium text-sm truncate ${entry.isCurrentUser ? 'text-green-800' : ''}`}>
                      {entry.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatCarbonAmount(entry.carbonSaved)}
                    </p>
                    <Badge variant="secondary" className={`text-xs ${getTierBadgeColor(entry.tier)}`}>
                      {entry.tier}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

       
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead className="w-[120px]">Carbon Saved</TableHead>
                <TableHead className="w-[120px]">GREEN Tokens</TableHead>
                <TableHead className="w-[100px]">Journeys</TableHead>
                <TableHead className="w-[100px]">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((entry, index) => {
                const rank = index + 1;
                return (
                  <TableRow
                    key={entry.id}
                    className={`${entry.isCurrentUser ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'}`}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {rank <= 3 ? getRankIcon(rank) : (
                          <span className="font-medium text-muted-foreground">#{rank}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          entry.isCurrentUser
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {entry.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium ${entry.isCurrentUser ? 'text-green-800' : ''}`}>
                            {entry.displayName}
                            {entry.isCurrentUser && (
                              <Star className="w-3 h-3 text-green-600 inline ml-1" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {entry.accountId.length > 10
                              ? `${entry.accountId.slice(0, 6)}...${entry.accountId.slice(-4)}`
                              : entry.accountId
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Leaf className="w-3 h-3 text-green-600" />
                        <span className="font-medium text-green-700">
                          {formatCarbonAmount(entry.carbonSaved)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Coins className="w-3 h-3 text-green-600" />
                        <span className="font-medium text-green-700">
                          {formatTokenAmount(entry.tokensEarned)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium">{entry.journeys}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className={getTierBadgeColor(entry.tier)}>
                        {entry.tier}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

                
        <div className="border-t bg-muted/20 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-muted-foreground">
                {leaderboardData.length} active eco-commuters
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">
                {formatCarbonAmount(leaderboardData.reduce((sum, entry) => sum + entry.carbonSaved, 0))} total CO₂ saved
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-600" />
              <span className="text-muted-foreground">
                Updated every 10 minutes
              </span>
            </div>
          </div>
        </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}