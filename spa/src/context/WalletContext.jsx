import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [coins, setCoins] = useState(0);
  const { user } = useAuth();

  // Keep wallet in sync with logged-in student user
  useEffect(() => {
    if (user && user.role === 'student' && user.coins !== undefined) {
      setCoins(user.coins);
    } else {
      setCoins(0);
    }
  }, [user]);

  // Update coins after a booking or recharge transaction
  const updateCoins = (newCoins) => {
    setCoins(newCoins);
    
    // Also sync to localStorage user object if it's the current user
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.coins = newCoins;
      localStorage.setItem('userData', JSON.stringify(parsed));
    }
  };

  return (
    <WalletContext.Provider value={{ coins, updateCoins }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
