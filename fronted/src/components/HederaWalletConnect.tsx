'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  LogOut,
  Coins,
  Loader2
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

interface WalletOption {
  id: 'hedera-wallets';
  name: string;
  description: string;
  icon: string;
  supported: boolean;
  recommended?: boolean;
  connectFn: () => Promise<void>;
}

interface HederaWalletConnectProps {
  triggerButton?: React.ReactNode;
  showBalance?: boolean;
}

export default function HederaWalletConnect({ triggerButton, showBalance = true }: HederaWalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    wallet,
    disconnectWallet,
    connectWallet,
    loading,
    error
  } = useWallet();

  const walletOptions: WalletOption[] = [
    {
      id: 'hedera-wallets',
      name: 'Connect Hedera Wallet',
      description: 'HashPack, Blade, Kabila, and other Hedera wallets',
      icon: '🔗',
      supported: true,
      recommended: true,
      connectFn: connectWallet
    },
  ];

  const handleConnect = async (option: WalletOption) => {
    try {
      await option.connectFn();
      toast.success(`Connected to ${option.name} successfully!`);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || `Failed to connect to ${option.name}`);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
    setIsOpen(false);
  };

  const copyAccountId = () => {
    if (wallet.accountId) {
      navigator.clipboard.writeText(wallet.accountId);
      toast.success('Account ID copied to clipboard');
    }
  };

  const truncateAccountId = (accountId: string) => {
    if (accountId.length <= 12) return accountId;
    return `${accountId.slice(0, 6)}...${accountId.slice(-6)}`;
  };

  if (wallet.isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <div className="flex items-center gap-3">
              {showBalance && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border border-border">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-secondary-foreground">
                    {wallet.balance} HBAR
                  </span>
                </div>
              )}

              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">{truncateAccountId(wallet.accountId)}</span>
                <span className="sm:hidden">Wallet</span>
              </Button>
            </div>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Wallet Connected
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <h3 className="font-semibold">
                      {wallet.walletType === 'hashpack' ? 'HashPack' :
                       wallet.walletType === 'blade' ? 'Blade' :
                       wallet.walletType === 'kabila' ? 'Kabila' : 'Hedera Wallet'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Connected via WalletConnect</p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground ml-auto">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono flex-1">
                        {wallet.accountId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAccountId}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-semibold">{wallet.balance} HBAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open('https://hashscan.io/testnet', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on HashScan
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="flex-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>

            {error && (
              <Card className="border-destructive/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Connect Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {walletOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all border-2 hover:border-primary/50 ${
                !option.supported ? 'opacity-50 cursor-not-allowed' : ''
              } ${option.recommended ? 'border-primary/30 bg-secondary/30' : ''}`}
              onClick={() => option.supported && !loading && handleConnect(option)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{option.name}</h3>
                        {option.recommended && (
                          <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>

                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle
                      className={`w-5 h-5 ${
                        option.supported ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-accent bg-accent/30">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-accent-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-accent-foreground">Secure Connection</p>
                <p className="text-accent-foreground/80">
                  EcoRide uses industry-standard security practices. Your private keys never leave your wallet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}