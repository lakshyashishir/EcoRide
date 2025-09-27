'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  LogOut,
  Coins
} from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount } from '@/utils/carbonCalculator';
import { toast } from 'sonner';

interface WalletOption {
  id: 'hashpack' | 'metamask';
  name: string;
  description: string;
  icon: string;
  supported: boolean;
  recommended?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'hashpack',
    name: 'HashPack',
    description: 'Native Hedera wallet with full HTS support',
    icon: '🔗',
    supported: true,
    recommended: true,
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Popular browser wallet with Hedera EVM support',
    icon: '🦊',
    supported: true,
  },
];

interface WalletConnectProps {
  triggerButton?: React.ReactNode;
  showBalance?: boolean;
}

export default function WalletConnect({ triggerButton, showBalance = true }: WalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const {
    wallet,
    tokenBalance,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    totalTokens,
    isConnected,
  } = useHedera();

  const handleConnect = async (walletType: 'hashpack' | 'metamask') => {
    setIsConnecting(walletType);

    try {
      await connectWallet(walletType);
      toast.success(`Connected to ${walletType === 'hashpack' ? 'HashPack' : 'MetaMask'} successfully!`);
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(null);
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

  if (isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <div className="flex items-center gap-3">
              {showBalance && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <Coins className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {formatTokenAmount(totalTokens)} GREEN
                  </span>
                </div>
              )}

              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">{truncateAccountId(wallet.accountId)}</span>
                <span className="sm:hidden">Wallet</span>
              </Button>
            </div>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Wallet Connected
            </DialogTitle>
            <DialogDescription>
              Your {wallet.type === 'hashpack' ? 'HashPack' : 'MetaMask'} wallet is connected to EcoRide
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">
                    {wallet.type === 'hashpack' ? '🔗' : '🦊'}
                  </span>
                  {wallet.type === 'hashpack' ? 'HashPack' : 'MetaMask'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Account ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
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
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-600" />
                  Token Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : tokenBalance.length > 0 ? (
                  <div className="space-y-3">
                    {tokenBalance.map((token) => (
                      <div key={token.tokenId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            Token ID: {token.tokenId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatTokenAmount(token.balance)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {token.decimals} decimals
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No GREEN tokens yet. Start scanning metro tickets to earn rewards!
                  </p>
                )}
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
              <Card className="border-red-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-red-600">
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
          <Button className="gradient-green text-white hover:shadow-green-glow">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to EcoRide and start earning carbon rewards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {WALLET_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all border-2 hover:border-green-300 ${
                !option.supported ? 'opacity-50 cursor-not-allowed' : ''
              } ${option.recommended ? 'border-green-200 bg-green-50' : ''}`}
              onClick={() => option.supported && handleConnect(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{option.name}</h3>
                        {option.recommended && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>

                  {isConnecting === option.id ? (
                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle
                      className={`w-5 h-5 ${
                        option.supported ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Secure Connection</p>
                <p className="text-blue-700">
                  EcoRide uses industry-standard security practices. Your private keys never leave your wallet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-red-600">
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