'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, QrCode, Scan, Wallet, TrendingUp, Award, Users, Shield, ArrowRight } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import HederaWalletConnect from '@/components/HederaWalletConnect';
import { useWallet } from '@/contexts/WalletContext';

interface WebsiteHomePageProps {
  onNavigate: (section: string) => void;
}

export default function WebsiteHomePage({ onNavigate }: WebsiteHomePageProps) {
  const { wallet } = useWallet();

  const mockTotalTokens = 125.75;
  const mockTotalJourneys = 23;
  const mockTotalCarbonSaved = 15.2;

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
            <QRScanner inline onScanSuccess={() => onNavigate('processing')} />

            {/* Stats (optional, shown when connected) */}
            {wallet.isConnected && (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{mockTotalTokens}</p>
                  <p className="text-sm text-muted-foreground">GREEN Tokens</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-2">{mockTotalJourneys}</p>
                  <p className="text-sm text-muted-foreground">Metro Journeys</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-3">{mockTotalCarbonSaved}kg</p>
                  <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      
      

      {/* CTA Section */}
      <section className="py-12 max-w-5xl mx-auto">
        <div className="container mx-auto">
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Ready to Start Your Sustainable Journey?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect your wallet today and start earning rewards for every metro journey in Delhi
              </p>
              {!wallet.isConnected ? (
                <HederaWalletConnect
                  triggerButton={
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Wallet Now
                    </Button>
                  }
                />
              ) : (
                <Button
                  size="lg"
                  onClick={() => onNavigate('dashboard')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  View Your Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}