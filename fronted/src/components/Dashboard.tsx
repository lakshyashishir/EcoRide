'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Leaf,
  TrendingUp,
  Award,
  Coins,
  Train,
  Target,
  Zap,
  Trees,
  Car,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import {
  calculateTotalImpact,
  formatCarbonAmount,
  formatTokenAmount,
  getCarbonTier,
  getTierProgress,
  getCarbonInsights,
} from '@/utils/carbonCalculator';

interface DashboardProps {
  className?: string;
}

export default function Dashboard({ className = '' }: DashboardProps) {
  const { wallet, loading } = useWallet();

  if (!wallet.isConnected) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Card className="p-8 text-center max-w-md mx-auto">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Coins className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your dashboard and track your metro journeys.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    journeys = [],
    totalTokens = 0,
    totalCarbonSaved = 0,
    totalJourneys = 0,
  } = {}; 

  const displayData = {
    totalTokens,
    totalCarbonSaved,
    totalJourneys,
    journeys
  };

  const totalImpact = calculateTotalImpact(displayData.journeys);
  const currentTier = getCarbonTier(displayData.totalCarbonSaved);
  const tierProgress = getTierProgress(displayData.totalCarbonSaved);
  const insights = getCarbonInsights(displayData.totalCarbonSaved, displayData.totalJourneys);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">GREEN Tokens</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatTokenAmount(displayData.totalTokens)}
                </p>
                <p className="text-xs text-green-600">
                  +{formatTokenAmount(totalImpact.totalTokensEarned)} earned
                </p>
              </div>
              <Coins className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Carbon Saved</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCarbonAmount(displayData.totalCarbonSaved)}
                </p>
                <p className="text-xs text-emerald-600">
                  Based on DMRC calculations
                </p>
              </div>
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Metro Journeys</p>
                <p className="text-2xl font-bold text-blue-700">{displayData.totalJourneys}</p>
                <p className="text-xs text-blue-600">
                  {totalImpact.totalDistance.toFixed(1)} km total
                </p>
              </div>
              <Train className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Eco Tier</p>
                <p className="text-2xl font-bold text-amber-700">{currentTier.tier}</p>
                <p className="text-xs text-amber-600">
                  {tierProgress.isMaxTier ? 'Max tier!' : `${tierProgress.remaining.toFixed(1)}kg to ${tierProgress.nextTier}`}
                </p>
              </div>
              <Award className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Eco Tier Progress
            </CardTitle>
            <CardDescription>
              Track your progress towards the next sustainability tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="text-sm px-3 py-1"
                style={{ backgroundColor: `${currentTier.color}20`, color: currentTier.color }}
              >
                {currentTier.tier} Tier
              </Badge>
              {!tierProgress.isMaxTier && (
                <span className="text-sm text-muted-foreground">
                  {tierProgress.progress.toFixed(0)}% to {tierProgress.nextTier}
                </span>
              )}
            </div>

            {!tierProgress.isMaxTier && (
              <Progress value={tierProgress.progress} className="h-3" />
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Progress</p>
                <p className="font-medium">{formatCarbonAmount(displayData.totalCarbonSaved)}</p>
              </div>
              {!tierProgress.isMaxTier && (
                <div>
                  <p className="text-muted-foreground">Next Goal</p>
                  <p className="font-medium">{formatCarbonAmount(tierProgress.remaining)} more</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trees className="w-5 h-5 text-green-600" />
              Environmental Impact
            </CardTitle>
            <CardDescription>
              Your contribution to a cleaner environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Trees className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-700">
                  {totalImpact.annualTreesEquivalent.toFixed(1)}
                </p>
                <p className="text-xs text-green-600">Trees/year equivalent</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Car className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-700">
                  {totalImpact.annualCarPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-blue-600">Annual car emissions</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average per journey</span>
                <span className="text-sm font-medium">
                  {formatCarbonAmount(totalImpact.averagePerJourney.carbonSaved)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tokens per journey</span>
                <span className="text-sm font-medium text-green-600">
                  {formatTokenAmount(totalImpact.averagePerJourney.tokensEarned)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              Your Impact Insights
            </CardTitle>
            <CardDescription>
              Personalized insights based on your sustainability journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(0, 4).map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'achievement'
                      ? 'bg-green-50 border-l-green-500'
                      : insight.type === 'projection'
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'bg-emerald-50 border-l-emerald-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'achievement' && (
                      <Award className="w-4 h-4 text-green-600 mt-0.5" />
                    )}
                    {insight.type === 'projection' && (
                      <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                    )}
                    {insight.type === 'environment' && (
                      <Trees className="w-4 h-4 text-emerald-600 mt-0.5" />
                    )}
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Continue your sustainability journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 w-full">
                <Train className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Recent Journeys</span>
                <ArrowUpRight className="w-3 h-3 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                View your metro journey history
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 w-full">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Leaderboard</span>
                <ArrowUpRight className="w-3 h-3 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                See how you rank among eco-commuters
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 w-full">
                <Coins className="w-4 h-4 text-green-600" />
                <span className="font-medium">Redeem Tokens</span>
                <ArrowUpRight className="w-3 h-3 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Use tokens at partner merchants
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}