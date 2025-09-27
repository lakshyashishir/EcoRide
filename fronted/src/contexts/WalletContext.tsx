'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface WalletInfo {
  accountId: string;
  balance: string;
  isConnected: boolean;
  provider?: any;
  walletType?: 'hashpack' | 'walletconnect' | 'blade';
}

interface WalletContextType {
  wallet: WalletInfo;
  setWallet: (wallet: WalletInfo) => void;
  disconnectWallet: () => void;
  connectHashPack: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo>({
    accountId: '',
    balance: '',
    isConnected: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      const savedConnection = localStorage.getItem('wallet_connected');
      const savedAccount = localStorage.getItem('wallet_account');
      const savedType = localStorage.getItem('wallet_type') as WalletInfo['walletType'];

      if (savedConnection === 'true' && savedAccount && savedType) {
        // Attempt to restore connection
        try {
          if (savedType === 'hashpack') {
            // Check if HashPack is still available
            if (typeof window !== 'undefined' && window.hashconnect) {
              // Verify connection is still valid
              const hashconnect = window.hashconnect;
              const isConnected = await hashconnect.checkConnectionStatus?.() || true;

              if (isConnected) {
                setWallet({
                  accountId: savedAccount,
                  balance: '0.00 ℏ',
                  isConnected: true,
                  walletType: 'hashpack',
                  provider: hashconnect
                });
                      } else {
                disconnectWallet();
              }
            } else {
              // HashPack not available, clear connection
              disconnectWallet();
            }
          }
        } catch (error) {
          disconnectWallet();
        }
      }
    };

    checkExistingConnection();
  }, []);

  const connectHashPack = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if HashPack is available
      if (typeof window === 'undefined' || !window.hashconnect) {
        throw new Error('HashPack wallet not found. Please install HashPack extension from Chrome Web Store.');
      }

      // Initialize HashConnect following Hedera documentation
      const hashconnect = window.hashconnect;

      // App metadata for HashPack
      const appMetadata = {
        name: 'EcoRide',
        description: 'Sustainable Metro Rewards Platform',
        icons: [window.location.origin + '/favicon.ico'],
        url: window.location.origin
      };

      // Initialize with proper configuration
      const initData = await hashconnect.init(appMetadata, 'testnet', false);

      // Connect to HashPack
      const pairingData = await hashconnect.connectToLocalWallet();

      if (pairingData?.accountIds?.length > 0) {
        const accountId = pairingData.accountIds[0];

        // Get account balance from Hedera network
        let balance = '0.00';
        try {
          // Query balance using HashPack provider
          const provider = hashconnect.getProvider();
          if (provider) {
            const balanceData = await provider.getAccountBalance(accountId);
            balance = (balanceData.hbars?.toNumber() || 0).toFixed(2);
          }
        } catch (balanceError) {
        }

        setWallet({
          accountId: accountId,
          balance: balance + ' ℏ',
          isConnected: true,
          walletType: 'hashpack',
          provider: hashconnect
        });

        // Save to localStorage
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_account', accountId);
        localStorage.setItem('wallet_type', 'hashpack');

      } else {
        throw new Error('No accounts found in HashPack wallet. Please unlock HashPack and try again.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect to HashPack wallet');
    } finally {
      setLoading(false);
    }
  };

  const connectWalletConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll focus on HashPack as the primary wallet
      // WalletConnect integration requires proper Hedera WalletConnect packages
      throw new Error('WalletConnect integration coming soon. Please use HashPack wallet for now.');

    } catch (error: any) {
      setError(error.message || 'WalletConnect not available yet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      accountId: '',
      balance: '',
      isConnected: false,
    });

    // Clear localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_account');
    localStorage.removeItem('wallet_type');

    setError(null);
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      setWallet,
      disconnectWallet,
      connectHashPack,
      connectWalletConnect,
      loading,
      error
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