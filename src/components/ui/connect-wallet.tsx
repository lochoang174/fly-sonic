import { useWallet } from '../../hooks/use-wallet';
import React from 'react';

const ConnectWallet: React.FC = () => {
  const { connectWallet, address } = useWallet();

  return (
    <>
    {!address ? (
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg 
        transition duration-200 ease-in-out transform hover:scale-105 
        shadow-md hover:shadow-lg"
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
    ) : (
      <p className="font-medium text-gray-700 bg-gray-100 py-2 px-4 rounded-lg">
        {address}
      </p>
    )}
    </>
  );
};

export default ConnectWallet;
