
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Coins, Leaf, TrendingUp, Home, Gift } from 'lucide-react';

interface SuccessPageProps {
  onNavigate: (section: string) => void;
  journeyData?: {
    from?: string;
    to?: string;
    fromStation?: string;
    toStation?: string;
    distance?: number;
    tokensEarned?: number;
    carbonSaved?: number;
  };
}

export default function SuccessPage({ onNavigate, journeyData }: SuccessPageProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const displayData = {
    from: journeyData?.from || journeyData?.fromStation || 'Unknown',
    to: journeyData?.to || journeyData?.toStation || 'Unknown',
    distance: journeyData?.distance || 0,
    tokensEarned: journeyData?.tokensEarned || 0,
    carbonSaved: journeyData?.carbonSaved || 0,
    timeStamp: new Date().toLocaleTimeString(),
  };

  return (
    <div className="min-h-screen bg-background flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto space-y-6">

          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Journey Verified!</h1>
              <p className="text-muted-foreground text-sm">Your sustainable journey has been recorded</p>
            </div>
          </div>

          {/* Journey Summary */}
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Badge className="bg-primary text-primary-foreground">Journey Complete</Badge>

                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    {displayData.from} → {displayData.to}
                  </p>
                  <p className="text-sm text-muted-foreground">{displayData.distance} km • {displayData.timeStamp}</p>
                </div>

                {/* Rewards Earned */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                      <Coins className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-primary">+{displayData.tokensEarned}</p>
                    <p className="text-xs text-muted-foreground">GREEN tokens</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                      <Leaf className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-secondary-foreground">{displayData.carbonSaved}g</p>
                    <p className="text-xs text-muted-foreground">CO₂ saved</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Details */}
          {showDetails && (
            <Card className="border-border shadow-lg animate-fade-in">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Environmental Impact
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">vs. Car journey</span>
                    <span className="font-medium text-primary">
                      {displayData.carbonSaved > 0 ?
                        `${Math.round(((displayData.carbonSaved / 1000) / (displayData.distance * 0.21)) * 100)}%` :
                        '68%'
                      } less emissions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equivalent to</span>
                    <span className="font-medium text-foreground">
                      {displayData.carbonSaved > 0 ?
                        `${((displayData.carbonSaved / 1000) / 21.77).toFixed(3)}` :
                        '0.02'
                      } trees planted
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel saved</span>
                    <span className="font-medium text-foreground">
                      {displayData.distance > 0 ?
                        `${(displayData.distance * 0.08).toFixed(1)}L` :
                        '0.8L'
                      } petrol
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => onNavigate('rewards')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Gift className="w-4 h-4 mr-2" />
              View Rewards
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onNavigate('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('home')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
