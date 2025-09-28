'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { apiService } from '@/services/api';

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


export const useHedera = () => {
  const walletContext = useWallet();

  const [wallet, setWallet] = useState<UserWallet>({
    accountId: '',
    publicKey: '',
    connected: false,
    type: null,
  });

  const [tokenBalance, setTokenBalance] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<HederaTransaction[]>([]);
  const [journeys, setJourneys] = useState<CarbonJourney[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAssociated, setTokenAssociated] = useState<boolean>(true);
  const [checkingAssociation, setCheckingAssociation] = useState<boolean>(false);


  const loadUserJourneys = useCallback(async (accountId: string) => {
    try {
      const messagesResponse = await apiService.getTopicMessages();

      if (messagesResponse.success && messagesResponse.data.messages) {

        const userJourneys = messagesResponse.data.messages
          .filter((msg: any) => {
            try {
              const messageData = JSON.parse(msg.message);
              return (messageData.userAccountId === accountId) || (messageData.uid === accountId);
            } catch (e) {
              return false;
            }
          })
          .map((msg: any, index: number) => {
            try {
              const messageData = JSON.parse(msg.message);
              const isCompact = messageData.jid !== undefined;

              return {
                id: messageData.journeyId || messageData.jid || `journey_${index}`,
                fromStation: isCompact ? messageData.journey?.from : messageData.journey?.fromStation || '',
                toStation: isCompact ? messageData.journey?.to : messageData.journey?.toStation || '',
                distance: isCompact ? messageData.journey?.dist : messageData.journey?.distance?.value || 0,
                carbonSaved: isCompact ? parseFloat(messageData.carbon?.kg || '0') : (messageData.carbonCalculation?.carbonSavedKg ? parseFloat(messageData.carbonCalculation.carbonSavedKg) : 0),
                tokensEarned: isCompact ? messageData.rewards?.tokens : messageData.rewards?.tokensEarned || 0,
                timestamp: messageData.timestamp || messageData.ts,
                hcsMessageId: msg.sequenceNumber,
                verified: true,
              };
            } catch {
              return null;
            }
          })
          .filter((journey: any) => journey !== null);

        setJourneys(userJourneys);
      }
    } catch (err) {
      console.error('Failed to load user journeys:', err);
    }
  }, []);

  const loadUserData = useCallback(async (accountId: string) => {
    if (!accountId) return;

    try {
      await loadUserJourneys(accountId);
    } catch (err) {
      console.error('Failed to load HCS journeys:', err);
    }

    try {
      const balanceResponse = await apiService.getTokenBalance(accountId);
      if (balanceResponse.success) {
        const tokenData = {
          tokenId: balanceResponse.data.tokenId,
          symbol: balanceResponse.data.tokenSymbol,
          balance: parseFloat(balanceResponse.data.balance),
          decimals: 2,
        };
        setTokenBalance([tokenData]);
      }
    } catch (err) {
      console.error('Failed to load token balance:', err);
    }

    try {
      const transfersResponse = await apiService.getUserTokenTransfers(accountId);
      if (transfersResponse.success && transfersResponse.data.transfers) {
        const transfers = transfersResponse.data.transfers.map((transfer: any) => {
          let timestamp;
          try {
            if (transfer.consensus_timestamp) {
              timestamp = new Date(parseFloat(transfer.consensus_timestamp) * 1000).toISOString();
            } else {
              timestamp = new Date().toISOString();
            }
          } catch (e) {
            timestamp = new Date().toISOString();
          }

          return {
            id: transfer.transaction_id,
            type: 'token_transfer' as const,
            amount: transfer.amount / 100,
            tokenId: transfer.token_id,
            timestamp,
            status: 'success' as const,
            hash: transfer.transaction_hash,
          };
        });
        setTransactions(transfers);
      }
    } catch (err) {
      console.error('Failed to load token transfers:', err);
    }
  }, [loadUserJourneys]);

  const checkTokenAssociation = useCallback(async (accountId: string) => {
    if (!accountId) return;

    setCheckingAssociation(true);
    try {
      const response = await apiService.getTokenAssociation(accountId);
      if (response.success) {
        setTokenAssociated(response.data.isAssociated);
      } else {
        setTokenAssociated(false);
      }
    } catch (err) {
      console.error('Failed to check token association:', err);
      setTokenAssociated(false);
    } finally {
      setCheckingAssociation(false);
    }
  }, []);

  const connectWallet = useCallback(async (walletType: 'hashpack' | 'metamask') => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (Math.random() > 0.9) {
        throw new Error('Failed to connect to wallet. Please try again.');
      }

      const userAccountId = walletContext.wallet.accountId;

      setWallet({
        accountId: userAccountId,
        publicKey: `302a300506032b657003210000${Math.random().toString(16).slice(2, 34)}`,
        connected: true,
        type: walletType,
      });

      await loadUserData(userAccountId);
      await checkTokenAssociation(userAccountId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, checkTokenAssociation, walletContext.wallet.accountId]);

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
    setTokenAssociated(false);
    setError(null);
  }, []);

  const submitJourney = useCallback(async (journeyData: {
    fromStation: string;
    toStation: string;
    distance: number;
    qrData: string;
    carbonSaved?: number;
    fare?: number;
    qrHash?: string;
  }) => {
    if (!walletContext.wallet.isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!tokenAssociated) {
      throw new Error('GREEN2 token not associated with your account. Please associate the token in your wallet first to receive rewards.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const distanceKm = journeyData.distance;
      const carbonSavedGrams = journeyData.carbonSaved || Math.round(distanceKm * 154);
      const tokensEarned = Math.floor((carbonSavedGrams / 1000) * 10);
      const qrHash = journeyData.qrHash || `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const journeySubmission = {
        journeyId: `journey_${Date.now()}`,
        fromStation: journeyData.fromStation,
        toStation: journeyData.toStation,
        distance: distanceKm,
        carbonSaved: carbonSavedGrams,
        userAddress: walletContext.wallet.accountId,
        journeyTimestamp: new Date().toISOString(),
        qrHash: qrHash
      };

      const submissionResponse = await apiService.submitJourney(journeySubmission);

      if (!submissionResponse.success) {
        throw new Error(submissionResponse.error || 'Failed to submit journey');
      }

      const newJourney: CarbonJourney = {
        id: journeySubmission.journeyId,
        fromStation: journeyData.fromStation,
        toStation: journeyData.toStation,
        distance: distanceKm,
        carbonSaved: carbonSavedGrams / 1000,
        tokensEarned: tokensEarned,
        timestamp: journeySubmission.journeyTimestamp,
        hcsMessageId: submissionResponse.data?.hcs?.sequenceNumber,
        verified: true,
      };

      const newTransaction: HederaTransaction = {
        id: submissionResponse.data?.contract?.transactionId || Date.now().toString(),
        type: 'smart_contract',
        amount: tokensEarned,
        tokenId: process.env.NEXT_PUBLIC_GREEN_TOKEN_ID || '0.0.6916942',
        timestamp: new Date().toISOString(),
        status: 'success',
        hash: submissionResponse.data?.contract?.transactionHash,
      };

      setJourneys(prev => [newJourney, ...prev]);
      setTransactions(prev => [newTransaction, ...prev]);
      setTokenBalance(prev =>
        prev.map(token =>
          token.tokenId === (process.env.NEXT_PUBLIC_GREEN_TOKEN_ID || '0.0.6916942')
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
  }, [walletContext.wallet.isConnected]);

  const redeemTokens = useCallback(async (amount: number, merchantId: string) => {
    if (!walletContext.wallet.isConnected) {
      throw new Error('Wallet not connected');
    }

    const greenBalance = tokenBalance.find(t => t.symbol === 'GREEN2')?.balance || 0;
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
  }, [walletContext.wallet.isConnected, tokenBalance]);

  const getAccountBalance = useCallback(async () => {
    if (!walletContext.wallet.isConnected) return;

    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));


    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [walletContext.wallet.isConnected]);

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

  // Load data when wallet connects
  useEffect(() => {
    if (walletContext.wallet.isConnected && walletContext.wallet.accountId) {
      loadUserData(walletContext.wallet.accountId);
      checkTokenAssociation(walletContext.wallet.accountId);
    }
  }, [walletContext.wallet.isConnected, walletContext.wallet.accountId, loadUserData, checkTokenAssociation]);

  return {
    wallet,
    tokenBalance,
    transactions,
    journeys,
    isLoading,
    error,
    tokenAssociated,
    checkingAssociation,

    connectWallet,
    disconnectWallet,
    submitJourney,
    redeemTokens,
    getAccountBalance,
    checkTokenAssociation,
    loadUserData,
    loadUserJourneys,

    totalTokens: tokenBalance.find(t => t.symbol === 'GREEN2')?.balance || 0,
    totalCarbonSaved: journeys.reduce((sum, journey) => sum + journey.carbonSaved, 0),
    totalJourneys: journeys.length,
    isConnected: walletContext.wallet.isConnected,
  };
};