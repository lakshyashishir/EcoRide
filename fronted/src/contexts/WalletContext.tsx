'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';

export interface WalletInfo {
  accountId: string;
  balance: string;
  isConnected: boolean;
  provider?: any;
  walletType?: 'hashpack' | 'walletconnect' | 'blade' | 'kabila';
  connector?: DAppConnector;
}

interface WalletContextType {
  wallet: WalletInfo;
  setWallet: (wallet: WalletInfo) => void;
  disconnectWallet: () => void;
  connectWallet: () => Promise<void>;
  loading: boolean;
  error: string | null;
  dAppConnector: DAppConnector | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo>({
    accountId: '',
    balance: '',
    isConnected: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);

  useEffect(() => {
    const initializeDAppConnector = async () => {
      try {
        if (typeof window === 'undefined') return;

        const metadata = {
          name: 'EcoRide',
          description: 'Sustainable Metro Rewards Platform',
          url: window.location.origin,
          icons: [window.location.origin + '/favicon.ico'],
        };

        const connector = new DAppConnector(
          metadata,
          LedgerId.TESTNET,
          PROJECT_ID,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Testnet],
        );

        await connector.init({ logger: 'error' });
        setDAppConnector(connector);


      } catch (error) {
        console.error('Failed to initialize DAppConnector:', error);
        setError('Failed to initialize wallet connector');
      }
    };

    initializeDAppConnector();
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!dAppConnector) {
        throw new Error('Wallet connector not initialized. Please refresh the page and try again.');
      }

      const session = await dAppConnector.openModal();

      if (session) {
        const accounts = session.namespaces?.hedera?.accounts || [];
        if (accounts.length > 0) {
          const accountId = accounts[0].split(':')[2];

          let walletType: WalletInfo['walletType'] = 'walletconnect';
          if (session.peer?.metadata?.name?.toLowerCase().includes('hashpack')) {
            walletType = 'hashpack';
          } else if (session.peer?.metadata?.name?.toLowerCase().includes('blade')) {
            walletType = 'blade';
          } else if (session.peer?.metadata?.name?.toLowerCase().includes('kabila')) {
            walletType = 'kabila';
          }

          let balance = '0.00 ℏ';
          try {
            const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`);
            if (response.ok) {
              const accountData = await response.json();
              const hbarBalance = (accountData.balance.balance / 100000000).toFixed(8);
              balance = `${hbarBalance} ℏ`;
            }
          } catch (error) {
            console.warn('Failed to fetch balance:', error);
          }

          setWallet({
            accountId,
            balance,
            isConnected: true,
            walletType,
            connector: dAppConnector,
          });

        } else {
          throw new Error('No accounts found in the connected wallet');
        }
      } else {
        throw new Error('Connection failed - no session established');
      }

    } catch (error: any) {
      console.error('Wallet connection error:', error);

      let errorMessage = error.message;
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        errorMessage = 'Connection was rejected. Please accept the connection request in your wallet.';
      } else if (error.message?.includes('not initialized')) {
        errorMessage = 'Wallet connector not ready. Please refresh the page and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timed out. Please try again and make sure your wallet is unlocked.';
      }

      setError(errorMessage);
      setWallet({ accountId: '', balance: '', isConnected: false });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (dAppConnector && wallet.isConnected) {
        await dAppConnector.disconnectAll();
      }
    } catch (error) {
      console.warn('Error disconnecting from WalletConnect:', error);
    }

    setWallet({
      accountId: '',
      balance: '',
      isConnected: false,
    });

    setError(null);
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      setWallet,
      disconnectWallet,
      connectWallet,
      loading,
      error,
      dAppConnector
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;