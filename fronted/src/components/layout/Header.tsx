'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Leaf,
  QrCode,
  BarChart3,
  History,
  Trophy,
  Store,
  Settings,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import WalletConnect from '@/components/WalletConnect';
import QRScanner from '@/components/QRScanner';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount } from '@/utils/carbonCalculator';

interface HeaderProps {
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  // { id: 'scan', label: 'Scan Ticket', icon: QrCode },
  { id: 'history', label: 'Journey History', icon: History },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'merchants', label: 'Redeem Tokens', icon: Store },
];

export default function Header({ onNavigate, currentSection = 'dashboard' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isConnected, totalTokens } = useHedera();

  const handleNavigation = (section: string) => {
    onNavigate?.(section);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigation('dashboard')}
              className="flex items-center space-x-2 text-xl font-bold text-green-700 hover:text-green-800 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline">EcoRide</span>
            </button>

            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;

                if (item.id === 'scan') {
                  return (
                    <QRScanner
                      key={item.id}
                      triggerButton={
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className={isActive ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </Button>
                      }
                    />
                  );
                }

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.id)}
                    className={isActive ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {isConnected && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  {formatTokenAmount(totalTokens)} GREEN
                </span>
              </div>
            )}

            

            <WalletConnect showBalance={false} />

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 pb-4 border-b">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-green-700">EcoRide</span>
                  </div>

                  {isConnected && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600">GREEN Balance</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-bold text-green-700">
                            {formatTokenAmount(totalTokens)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <nav className="flex-1 mt-6">
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.id;

                        if (item.id === 'scan') {
                          return (
                            <QRScanner
                              key={item.id}
                              triggerButton={
                                <Button
                                  variant={isActive ? "default" : "ghost"}
                                  className={`w-full justify-start ${
                                    isActive ? "bg-green-600 hover:bg-green-700" : ""
                                  }`}
                                >
                                  <Icon className="w-4 h-4 mr-3" />
                                  {item.label}
                                </Button>
                              }
                            />
                          );
                        }

                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "default" : "ghost"}
                            className={`w-full justify-start ${
                              isActive ? "bg-green-600 hover:bg-green-700" : ""
                            }`}
                            onClick={() => handleNavigation(item.id)}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>
                  </nav>

                  <div className="pt-4 border-t space-y-2">
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigation('settings')}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {isConnected && (
        <div className="md:hidden border-t bg-green-50/50 px-4 py-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              {formatTokenAmount(totalTokens)} GREEN tokens
            </span>
          </div>
        </div>
      )}
    </header>
  );
}