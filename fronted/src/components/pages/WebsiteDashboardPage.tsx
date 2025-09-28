'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Coins, Leaf, Train, TrendingUp, Award, Clock, Users, Target, Zap } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount, formatCarbonAmount, getCarbonTier, getTierProgress, calculateTotalImpact } from '@/utils/carbonCalculator';

interface WebsiteDashboardPageProps {
  onNavigate: (section: string) => void;
}


export default function WebsiteDashboardPage({ onNavigate }: WebsiteDashboardPageProps) {
  const { wallet } = useWallet();
  const {
    totalTokens,
    totalCarbonSaved,
    totalJourneys,
    journeys,
    isLoading
  } = useHedera();

  // Redirect to connection if wallet not connected
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Card className="p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Coins className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-foreground">Connect Your Wallet</CardTitle>
                <p className="text-muted-foreground">
                  Please connect your wallet to view your sustainability dashboard and track your metro journey progress.
                </p>
                <Button
                  onClick={() => onNavigate('home')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Go to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const displayData = {
    totalTokens,
    totalCarbonSaved,
    totalJourneys
  };

  const totalImpact = calculateTotalImpact(journeys);
  const currentTier = getCarbonTier(totalCarbonSaved);
  const tierProgress = getTierProgress(totalCarbonSaved);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Your Sustainability Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your eco-friendly journey progress and environmental impact
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Total GREEN Tokens</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatTokenAmount(displayData.totalTokens)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-foreground mb-1">Carbon Saved</p>
                  <p className="text-3xl font-bold text-secondary-foreground">
                    {formatCarbonAmount(displayData.totalCarbonSaved)}
                  </p>
                  <p className="text-xs text-secondary-foreground mt-1">
                    Calculated by DMRC
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chart-2 mb-1">Metro Journeys</p>
                  <p className="text-3xl font-bold text-chart-2">{displayData.totalJourneys}</p>
                  <p className="text-xs text-chart-2 mt-1">
                    {displayData.totalJourneys} journeys
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2 rounded-full flex items-center justify-center">
                  <Train className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chart-3 mb-1">Eco Tier</p>
                  <p className="text-3xl font-bold text-chart-3">{currentTier.tier}</p>
                  <p className="text-xs text-chart-3 mt-1">
                    {tierProgress.isMaxTier ? 'Max tier!' : `${formatCarbonAmount(tierProgress.remaining)} to ${tierProgress.nextTier}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">

          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Clock className="w-6 h-6 text-chart-4" />
                  Recent Journeys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journeys.length > 0 ? journeys.slice(0, 4).map((journey) => (
                    <div key={journey.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-chart-2/20 rounded-full flex items-center justify-center">
                          <Train className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {journey.fromStation} → {journey.toStation}
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(journey.timestamp).toLocaleDateString()} • {journey.distance} km</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">+{formatTokenAmount(journey.tokensEarned)} GREEN</p>
                        <p className="text-sm text-muted-foreground">{formatCarbonAmount(journey.carbonSaved)} CO₂ saved</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Connect your wallet to view your journey history</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onNavigate('history')}
                    className="flex-1"
                  >
                    View All Journeys
                  </Button>
                  <Button
                    onClick={() => onNavigate('home')}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Scan New Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Tier Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-primary-foreground">{currentTier.tier}</Badge>
                  <span className="text-sm text-muted-foreground">Level {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(currentTier.tier) + 1}</span>
                </div>
                <Progress value={tierProgress.progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {tierProgress.isMaxTier ? 'Maximum tier achieved!' : `${formatCarbonAmount(tierProgress.remaining)} more CO₂ saved to reach ${tierProgress.nextTier} tier`}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{formatTokenAmount(totalTokens)}</p>
                    <p className="text-xs text-muted-foreground">Tokens earned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chart-2">{totalJourneys}</p>
                    <p className="text-xs text-muted-foreground">Metro rides</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Monthly goal</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>

            
          </div>
        </div>



        </div>
      </div>
    </div>
  );
}