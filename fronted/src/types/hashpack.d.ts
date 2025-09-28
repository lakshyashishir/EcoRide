// Type definitions for Hedera WalletConnect integration

// Extend Window interface to include hashconnect
declare global {
  interface Window {
    hashconnect?: {
      [key: string]: any;
    };
  }
}

declare module '@hashgraph/hedera-wallet-connect' {
    export class DAppConnector {
      constructor(
        metadata: any,
        network: any,
        projectId: string,
        methods: string[],
        events: string[],
        chains: string[]
      );
  
      init(config?: { logger?: string }): Promise<void>;
      openModal(): Promise<void>;
      onSessionEvent(callback: (event: any) => void): void;
      walletConnectClient: {
        session: {
          getAll(): any[];
          delete(topic: string, reason: { code: number; message: string }): Promise<void>;
        };
      };
    }
  
    export enum HederaJsonRpcMethod {
      // Add methods as needed
    }
  
    export enum HederaSessionEvent {
      ChainChanged = 'chainChanged',
      AccountsChanged = 'accountsChanged'
    }
  
    export enum HederaChainId {
      Mainnet = 'hedera:mainnet',
      Testnet = 'hedera:testnet'
    }
  }
  
  export {};