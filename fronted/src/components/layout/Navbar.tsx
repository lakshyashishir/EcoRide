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
];

export default function Navbar({ onNavigate, currentSection }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { wallet } = useWallet();

  const handleNavigation = (section: string) => {
    onNavigate(section);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          <button
            onClick={() => handleNavigation('home')}
            className="flex items-center space-x-3 text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>EcoRide</span>
          </button>

          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = currentSection === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => handleNavigation(item.id)}
                  className={`${isActive ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">

            {wallet.isConnected && (
              <Button
                onClick={() => handleNavigation('home')}
                className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan Ticket
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

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

                  {wallet.isConnected && (
                    <div className="mt-4 p-4 bg-secondary rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Account</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <span className="font-bold text-foreground text-xs">
                            {wallet.accountId.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <nav className="flex-1 mt-6">
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const isActive = currentSection === item.id;

                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "default" : "ghost"}
                            className={`w-full justify-start ${
                              isActive ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""
                            }`}
                            onClick={() => handleNavigation(item.id)}
                          >
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
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 mr-3" />
                      ) : (
                        <Moon className="w-4 h-4 mr-3" />
                      )}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Button>
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