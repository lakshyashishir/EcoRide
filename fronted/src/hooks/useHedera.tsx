'use client';

import { useState, useCallback, useEffect } from 'react';

export interface HederaTransaction {
  id: string;
  type: 'token_transfer' | 'consensus_message' | 'smart_contract';
  amount?: number;
  tokenId?: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  hash?: string;
}

export interface UserWallet {
  accountId: string;
  publicKey: string;
  connected: boolean;
  type: 'hashpack' | 'metamask' | null;
}

export interface TokenBalance {
  tokenId: string;
  symbol: string;
  balance: number;
  decimals: number;
}

export interface CarbonJourney {
  id: string;
  fromStation: string;
  toStation: string;
  distance: number;
  carbonSaved: number;
  tokensEarned: number;
  timestamp: string;
  hcsMessageId?: string;
  verified: boolean;
}

const demoTokenBalance: TokenBalance[] = [
  {
    tokenId: '0.0.123456',
    symbol: 'GREEN',
    balance: 1250.75,
    decimals: 2,
  },
];

const demoJourneys: CarbonJourney[] = [
  {
    id: '1',
    fromStation: 'Rajiv Chowk',
    toStation: 'Connaught Place',
    distance: 2.5,
    carbonSaved: 0.425,
    tokensEarned: 4.25,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    hcsMessageId: '0.0.789-1234567890',
    verified: true,
  },
  {
    id: '2',
    fromStation: 'Kashmere Gate',
    toStation: 'Red Fort',
    distance: 3.2,
    carbonSaved: 0.544,
    tokensEarned: 5.44,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    hcsMessageId: '0.0.789-1234567891',
    verified: true,
  },
  {
    id: '3',
    fromStation: 'New Delhi',
    toStation: 'India Gate',
    distance: 4.1,
    carbonSaved: 0.697,
    tokensEarned: 6.97,
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    hcsMessageId: '0.0.789-1234567892',
    verified: true,
  },
];

export const useHedera = () => {
  const [wallet, setWallet] = useState<UserWallet>({
    accountId: '',
    publicKey: '',
    connected: false,
    type: null,
  });

  const [tokenBalance, setTokenBalance] = useState<TokenBalance[]>(demoTokenBalance);
  const [transactions, setTransactions] = useState<HederaTransaction[]>([]);
  const [journeys, setJourneys] = useState<CarbonJourney[]>(demoJourneys);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async (walletType: 'hashpack' | 'metamask') => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (Math.random() > 0.9) {
        throw new Error('Failed to connect to wallet. Please try again.');
      }

      const mockAccountId = walletType === 'hashpack'
        ? '0.0.123456'
        : '0.0.654321';

      setWallet({
        accountId: mockAccountId,
        publicKey: `302a300506032b657003210000${Math.random().toString(16).slice(2, 34)}`,
        connected: true,
        type: walletType,
      });

      setTokenBalance(demoTokenBalance);
      setJourneys(demoJourneys);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      accountId: '',
      publicKey: '',
      connected: false,
      type: null,
    });
    setTokenBalance([]);
    setTransactions([]);
    setJourneys([]);
    setError(null);
  }, []);

  const submitJourney = useCallback(async (journeyData: {
    fromStation: string;
    toStation: string;
    distance: number;
    qrData: string;
  }) => {
    if (!wallet.connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (Math.random() > 0.95) {
        throw new Error('Journey submission failed. Please try again.');
      }

      const carbonSaved = journeyData.distance * 0.138; 
      const tokensEarned = carbonSaved * 10; 

      const newJourney: CarbonJourney = {
        id: Date.now().toString(),
        fromStation: journeyData.fromStation,
        toStation: journeyData.toStation,
        distance: journeyData.distance,
        carbonSaved,
        tokensEarned,
        timestamp: new Date().toISOString(),
        hcsMessageId: `0.0.789-${Date.now()}`,
        verified: true,
      };

      const newTransaction: HederaTransaction = {
        id: Date.now().toString(),
        type: 'token_transfer',
        amount: tokensEarned,
        tokenId: '0.0.123456',
        timestamp: new Date().toISOString(),
        status: 'success',
        hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      };

      setJourneys(prev => [newJourney, ...prev]);
      setTransactions(prev => [newTransaction, ...prev]);
      setTokenBalance(prev =>
        prev.map(token =>
          token.tokenId === '0.0.123456'
            ? { ...token, balance: token.balance + tokensEarned }
            : token
        )
      );

      return newJourney;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Journey submission failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet.connected]);

  const redeemTokens = useCallback(async (amount: number, merchantId: string) => {
    if (!wallet.connected) {
      throw new Error('Wallet not connected');
    }

    const greenBalance = tokenBalance.find(t => t.symbol === 'GREEN')?.balance || 0;
    if (amount > greenBalance) {
      throw new Error('Insufficient token balance');
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (Math.random() > 0.95) {
        throw new Error('Token redemption failed. Please try again.');
      }

      const newTransaction: HederaTransaction = {
        id: Date.now().toString(),
        type: 'token_transfer',
        amount: -amount,
        tokenId: '0.0.123456',
        timestamp: new Date().toISOString(),
        status: 'success',
        hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setTokenBalance(prev =>
        prev.map(token =>
          token.tokenId === '0.0.123456'
            ? { ...token, balance: token.balance - amount }
            : token
        )
      );

      return newTransaction;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token redemption failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet.connected, tokenBalance]);

  const getAccountBalance = useCallback(async () => {
    if (!wallet.connected) return;

    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));


    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [wallet.connected]);

  useEffect(() => {
    const lastWalletType = localStorage.getItem('ecoride-wallet-type') as 'hashpack' | 'metamask' | null;
    const wasConnected = localStorage.getItem('ecoride-wallet-connected') === 'true';

    if (lastWalletType && wasConnected) {
      connectWallet(lastWalletType);
    }
  }, [connectWallet]);

  useEffect(() => {
    if (wallet.connected && wallet.type) {
      localStorage.setItem('ecoride-wallet-type', wallet.type);
      localStorage.setItem('ecoride-wallet-connected', 'true');
    } else {
      localStorage.removeItem('ecoride-wallet-type');
      localStorage.removeItem('ecoride-wallet-connected');
    }
  }, [wallet.connected, wallet.type]);

  return {
    wallet,
    tokenBalance,
    transactions,
    journeys,
    isLoading,
    error,

    connectWallet,
    disconnectWallet,
    submitJourney,
    redeemTokens,
    getAccountBalance,

    totalTokens: tokenBalance.reduce((sum, token) => sum + token.balance, 0),
    totalCarbonSaved: journeys.reduce((sum, journey) => sum + journey.carbonSaved, 0),
    totalJourneys: journeys.length,
    isConnected: wallet.connected,
  };
};