'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Leaf,
  Github,
  Twitter,
  Globe,
  Heart,
  Shield,
  ExternalLink,
  Zap,
  Users,
  BookOpen,
} from 'lucide-react';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/ecoride',
      label: 'View source code',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: 'https://twitter.com/ecoride',
      label: 'Follow updates',
    },
    {
      name: 'Website',
      icon: Globe,
      href: 'https://ecoride.app',
      label: 'Official website',
    },
  ];

  const quickLinks = [
    { name: 'How it Works', href: '#how-it-works', icon: BookOpen },
    { name: 'Carbon Calculator', href: '#carbon-calculator', icon: Leaf },
    { name: 'Partner Program', href: '#partners', icon: Users },
    { name: 'API Documentation', href: '#api-docs', icon: ExternalLink },
  ];

  const hederaServices = [
    { name: 'Token Service (HTS)', description: 'GREEN token management' },
    { name: 'Consensus Service (HCS)', description: 'Journey verification' },
    { name: 'Smart Contracts', description: 'Reward distribution' },
    { name: 'Mirror Node', description: 'Transaction history' },
  ];

  return (
    <footer className={`bg-white mt-auto ${className}`}>
      <div className="container mx-auto px-4">
       
      

        <div className="mt-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">Our Environmental Impact</h4>
                    <p className="text-sm text-green-700">
                      Together, we&apos;re making Delhi&apos;s air cleaner, one metro journey at a time.
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-6 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-800">15.2K</div>
                    <div className="text-xs text-green-600">kg CO₂ Saved</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-800">1.8K</div>
                    <div className="text-xs text-green-600">Active Users</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-800">12.5K</div>
                    <div className="text-xs text-green-600">Metro Journeys</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© {currentYear} EcoRide</span>
            <span>•</span>
            <Button variant="link" className="h-auto p-0 text-sm" size="sm">
              Privacy Policy
            </Button>
            <span>•</span>
            <Button variant="link" className="h-auto p-0 text-sm" size="sm">
              Terms of Service
            </Button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>for a sustainable future</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>
              EcoRide is a demonstration project built for the Hedera Hackathon.
              This application is deployed on Hedera Testnet and is not affiliated with Delhi Metro Rail Corporation (DMRC).
            </p>
            <p>
              Token rewards are for demonstration purposes only and have no real-world monetary value.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}