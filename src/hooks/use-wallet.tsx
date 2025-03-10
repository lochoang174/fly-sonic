import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  balance: string | null;
  provider: BrowserProvider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const newProvider = new BrowserProvider(window.ethereum);
        setProvider(newProvider);

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);

        const balance = await newProvider.getBalance(accounts[0]);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      console.error('MetaMask is not installed');
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setProvider(null);
    console.log('Wallet disconnected');
  };

  useEffect(() => {
    if (address && provider) {
      (async () => {
        try {
          const balance = await provider.getBalance(address);
          setBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      })();
    }
  }, [address, provider]);

  return (
    <WalletContext.Provider value={{ address, balance, provider, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
