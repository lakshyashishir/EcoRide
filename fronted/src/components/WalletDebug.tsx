'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { Bug, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function WalletDebug() {
  const { wallet, loading, error } = useWallet();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkWalletState = () => {
    const info = {
      hasWindow: typeof window !== 'undefined',
      hasHashconnect: typeof window !== 'undefined' && !!window.hashconnect,
      hashconnectMethods: typeof window !== 'undefined' && window.hashconnect
        ? Object.keys(window.hashconnect)
        : [],
      localStorage: {
        connected: localStorage.getItem('wallet_connected'),
        account: localStorage.getItem('wallet_account'),
        type: localStorage.getItem('wallet_type'),
      },
      walletState: wallet,
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_account');
    localStorage.removeItem('wallet_type');
    checkWalletState();
  };

  return (
    <Card className="max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Wallet Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkWalletState} variant="outline" size="sm">
            <Info className="w-4 h-4 mr-2" />
            Check State
          </Button>
          <Button onClick={clearLocalStorage} variant="outline" size="sm">
            Clear Storage
          </Button>
        </div>

        {/* Current Status */}
        <div className="space-y-2">
          <h3 className="font-medium">Current Status</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={wallet.isConnected ? "default" : "secondary"}>
              {wallet.isConnected ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {wallet.isConnected ? 'Connected' : 'Not Connected'}
            </Badge>

            <Badge variant={loading ? "outline" : "secondary"}>
              {loading ? 'Loading...' : 'Ready'}
            </Badge>

            {error && (
              <Badge variant="destructive">
                Error: {error}
              </Badge>
            )}
          </div>

          {wallet.isConnected && (
            <div className="text-sm space-y-1">
              <p><strong>Account:</strong> {wallet.accountId}</p>
              <p><strong>Balance:</strong> {wallet.balance}</p>
              <p><strong>Type:</strong> {wallet.walletType}</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="space-y-2">
            <h3 className="font-medium">Debug Information</h3>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}