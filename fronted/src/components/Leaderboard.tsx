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
} from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { formatCarbonAmount, formatTokenAmount, getCarbonTier } from '@/utils/carbonCalculator';

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

const generateMockLeaderboard = (currentUserAccountId?: string): LeaderboardEntry[] => {
  const mockUsers = [
    { name: 'EcoWarrior_Delhi', carbon: 15.2, tokens: 152, journeys: 45 },
    { name: 'GreenCommuter99', carbon: 12.8, tokens: 128, journeys: 38 },
    { name: 'SustainableRider', carbon: 11.4, tokens: 114, journeys: 42 },
    { name: 'CleanAirChamp', carbon: 10.9, tokens: 109, journeys: 35 },
    { name: 'MetroMaster', carbon: 9.7, tokens: 97, journeys: 31 },
    { name: 'PlanetSaver2024', carbon: 8.8, tokens: 88, journeys: 28 },
    { name: 'EcoFriendlyUser', carbon: 7.9, tokens: 79, journeys: 25 },
    { name: 'GreenTransport', carbon: 7.2, tokens: 72, journeys: 22 },
    { name: 'CarbonNeutral', carbon: 6.5, tokens: 65, journeys: 20 },
    { name: 'EcoCommuter', carbon: 5.8, tokens: 58, journeys: 18 },
  ];

  return mockUsers.map((user, index) => ({
    id: `user_${index}`,
    accountId: index === 0 && currentUserAccountId ? currentUserAccountId : `0.0.${100000 + index}`,
    displayName: user.name,
    carbonSaved: user.carbon,
    tokensEarned: user.tokens,
    journeys: user.journeys,
    tier: getCarbonTier(user.carbon).tier,
    isCurrentUser: index === 0 && !!currentUserAccountId,
  }));
};

export default function Leaderboard({
  className = '',
  period = 'allTime',
  maxEntries = 10,
}: LeaderboardProps) {
  const { wallet, totalCarbonSaved, totalTokens, totalJourneys, isConnected } = useHedera();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'allTime'>(period);

  const leaderboardData = useMemo(() => {
    const mockData = generateMockLeaderboard(isConnected ? wallet.accountId : undefined);

    if (isConnected && totalCarbonSaved > 0) {
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

      const insertIndex = mockData.findIndex(entry => entry.carbonSaved < totalCarbonSaved);
      if (insertIndex === -1) {
        mockData.push(userEntry);
      } else {
        mockData.splice(insertIndex, 0, userEntry);
      }

      return mockData.filter((entry, index, arr) =>
        !(entry.accountId === wallet.accountId && !entry.isCurrentUser)
      ).slice(0, maxEntries);
    }

    return mockData.slice(0, maxEntries);
  }, [isConnected, wallet.accountId, totalCarbonSaved, totalTokens, totalJourneys, maxEntries]);

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

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Connect Wallet to View Leaderboard
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Connect your wallet to see how you rank among eco-conscious commuters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
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
        {/* Top 3 Podium */}
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

        {/* Full Leaderboard Table */}
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

        {/* Stats Footer */}
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
  );
}