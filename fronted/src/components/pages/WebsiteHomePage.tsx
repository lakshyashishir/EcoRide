'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, QrCode, Scan, Wallet, TrendingUp, Award, Users, Shield, ArrowRight } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import HederaWalletConnect from '@/components/HederaWalletConnect';
import { useWallet } from '@/contexts/WalletContext';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount, formatCarbonAmount } from '@/utils/carbonCalculator';

interface WebsiteHomePageProps {
  onNavigate: (section: string, data?: any) => void;
}

export default function WebsiteHomePage({ onNavigate }: WebsiteHomePageProps) {
  const { wallet } = useWallet();
  const { totalTokens, totalJourneys, totalCarbonSaved } = useHedera();

  return (
    <div className="min-h-screen bg-card">

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="space-y-4">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                🌱 Sustainable Transport Rewards
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Earn <span className="text-gradient-green">GREEN</span> tokens for metro journeys
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join Delhi&apos;s sustainable transport revolution. Scan your metro ticket QR codes and earn blockchain rewards while reducing your carbon footprint.
              </p>
            </div>

            {/* Inline QR Scanner below heading */}
            <QRScanner
              inline
              onScanSuccess={(result) => {
                const journeyData = {
                  fromStation: result.fromStation,
                  toStation: result.toStation,
                  distance: result.distance,
                  carbonSaved: result.carbonSaved || 0,
                  tokensEarned: result.tokensEarned || 0
                };
                onNavigate('processing', journeyData);
              }}
            />

            
            {wallet.isConnected && (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{formatTokenAmount(totalTokens)}</p>
                  <p className="text-sm text-muted-foreground">GREEN Tokens</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-2">{totalJourneys}</p>
                  <p className="text-sm text-muted-foreground">Metro Journeys</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-3">{formatCarbonAmount(totalCarbonSaved)}</p>
                  <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      
      

      
    </div>
  );
}