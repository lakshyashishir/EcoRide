'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  Leaf,
  QrCode,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import HederaWalletConnect from '@/components/HederaWalletConnect';
import { useWallet } from '@/contexts/WalletContext';

interface NavbarProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

const navigationItems = [
  { id: 'home', label: 'Home' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'history', label: 'History' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'bridge', label: 'Cross-Chain Bridge' },
  { id: 'fraud-detection', label: 'Anti-Fraud' },
];

export default function Navbar({ onNavigate, currentSection }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { wallet } = useWallet();

  const protectedRoutes = ['dashboard', 'history', 'rewards', 'leaderboard', 'bridge', 'fraud-detection'];

  const handleNavigation = (section: string) => {
    if (protectedRoutes.includes(section) && !wallet.isConnected) {
      
      return;
    }
    onNavigate(section);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          
          <button
            onClick={() => handleNavigation('home')}
          >
            <img src={'/ecoride_logo.png'} height={40} className="h-52" />
          </button>

          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = currentSection === item.id;
              const isProtected = protectedRoutes.includes(item.id);
              const isDisabled = isProtected && !wallet.isConnected;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => handleNavigation(item.id)}
                  disabled={isDisabled}
                  className={`${
                    isActive
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : isDisabled
                        ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                        : "hover:bg-secondary"
                  }`}
                >
                  {item.label}
                  {isProtected && !wallet.isConnected && (
                    <span className="ml-1 text-xs opacity-70">🔒</span>
                  )}
                </Button>
              );
            })}
          </div>

          
          <div className="flex items-center space-x-4">

            {/* Scan Button */}
            {/* <Button
              onClick={() => handleNavigation('home')}
              className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan Ticket
            </Button> */}

           

           
            <HederaWalletConnect showBalance={true} />

            
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">

                  
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <span className="text-xl font-bold text-primary">EcoRide</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-secondary rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Account</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="font-bold text-foreground text-xs">
                          {wallet.isConnected ? wallet.accountId.slice(0, 8) + '...' : '0.0.123456...'}
                        </span>
                      </div>
                    </div>
                  </div>

           
                  <nav className="flex-1 mt-6">
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const isActive = currentSection === item.id;
                        const isProtected = protectedRoutes.includes(item.id);
                        const isDisabled = isProtected && !wallet.isConnected;

                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "default" : "ghost"}
                            disabled={isDisabled}
                            className={`w-full justify-start ${
                              isActive
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                            }`}
                            onClick={() => handleNavigation(item.id)}
                          >
                            {item.label}
                            {isProtected && !wallet.isConnected && (
                              <span className="ml-auto text-xs opacity-70">🔒</span>
                            )}
                          </Button>
                        );
                      })
                      }
                    </div>
                  </nav>

                  
                  <div className="pt-4 border-t space-y-2">
                    
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}