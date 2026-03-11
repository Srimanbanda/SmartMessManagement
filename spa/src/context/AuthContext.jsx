import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate state from local storage securely
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginStudent = async (credentials) => {
    try {

      console.log(1);
      const { data } = await apiClient.post('/api/student/login', credentials);
     console.log(2);
      if (data.success) {
        // Contract -> { success: true, student: { id, name, roll_no, coins } }
        const userObj = { ...data.student, role: 'student' };
        setUser(userObj);
        localStorage.setItem('userData', JSON.stringify(userObj));
        return { success: true, coins: userObj.coins };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const loginAdmin = async (credentials) => {
    try {
      const { data } = await apiClient.post('/api/admin/login', credentials);
      if (data.success) {
        // Contract -> { success: true, admin: { id, username, role } }
        const userObj = { ...data.admin };
        setUser(userObj);
        localStorage.setItem('userData', JSON.stringify(userObj));
        return { success: true, role: userObj.role };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
  };

  if (loading) return null; // Can be replaced by a full screen loader

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginStudent, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
