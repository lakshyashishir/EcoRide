'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Coins, Leaf, Train, TrendingUp, Award, Clock, Users, Target, Zap } from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount, formatCarbonAmount } from '@/utils/carbonCalculator';

interface WebsiteDashboardPageProps {
  onNavigate: (section: string) => void;
}

const recentJourneys = [
  {
    id: 1,
    from: 'Rajiv Chowk',
    to: 'AIIMS',
    date: 'Today 2:30 PM',
    tokens: 2.4,
    carbon: 245,
    distance: 8.5,
  },
  {
    id: 2,
    from: 'Connaught Place',
    to: 'Hauz Khas',
    date: 'Today 9:15 AM',
    tokens: 1.8,
    carbon: 180,
    distance: 6.2,
  },
  {
    id: 3,
    from: 'Kashmere Gate',
    to: 'Red Fort',
    date: 'Yesterday 6:45 PM',
    tokens: 1.2,
    carbon: 120,
    distance: 3.2,
  },
  {
    id: 4,
    from: 'New Delhi',
    to: 'India Gate',
    date: 'Yesterday 2:15 PM',
    tokens: 1.6,
    carbon: 160,
    distance: 4.1,
  },
];

export default function WebsiteDashboardPage({ onNavigate }: WebsiteDashboardPageProps) {
  const { totalTokens, totalCarbonSaved, totalJourneys, isConnected } = useHedera();

  // Mock data for demo when wallet is not connected
  const mockData = {
    totalTokens: 1250.75,
    totalCarbonSaved: 15.2,
    totalJourneys: 42
  };

  // Use mock data when wallet is not connected
  const displayData = isConnected ? {
    totalTokens,
    totalCarbonSaved,
    totalJourneys
  } : mockData;

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

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

          {/* Total Tokens */}
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Total GREEN Tokens</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatTokenAmount(displayData.totalTokens)}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    +12.5 this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carbon Saved */}
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-foreground mb-1">Carbon Saved</p>
                  <p className="text-3xl font-bold text-secondary-foreground">
                    {formatCarbonAmount(displayData.totalCarbonSaved)}
                  </p>
                  <p className="text-xs text-secondary-foreground mt-1">
                    vs. car travel
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Journeys */}
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chart-2 mb-1">Metro Journeys</p>
                  <p className="text-3xl font-bold text-chart-2">{displayData.totalJourneys}</p>
                  <p className="text-xs text-chart-2 mt-1">
                    127.3 km total
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2 rounded-full flex items-center justify-center">
                  <Train className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eco Tier */}
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chart-3 mb-1">Eco Tier</p>
                  <p className="text-3xl font-bold text-chart-3">Green Starter</p>
                  <p className="text-xs text-chart-3 mt-1">
                    12.5kg to Eco Warrior
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">

          {/* Recent Journeys */}
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
                  {recentJourneys.map((journey) => (
                    <div key={journey.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-chart-2/20 rounded-full flex items-center justify-center">
                          <Train className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {journey.from} → {journey.to}
                          </p>
                          <p className="text-sm text-muted-foreground">{journey.date} • {journey.distance} km</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">+{journey.tokens} GREEN</p>
                        <p className="text-sm text-muted-foreground">{journey.carbon}g CO₂ saved</p>
                      </div>
                    </div>
                  ))}
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

            {/* Eco Tier Progress */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Tier Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-primary-foreground">Green Starter</Badge>
                  <span className="text-sm text-muted-foreground">Level 1</span>
                </div>
                <Progress value={65} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  12.5 kg more CO₂ saved to reach Eco Warrior tier
                </p>
              </CardContent>
            </Card>

            {/* Monthly Stats */}
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
                    <p className="text-2xl font-bold text-primary">23.5</p>
                    <p className="text-xs text-muted-foreground">Tokens earned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chart-2">12</p>
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