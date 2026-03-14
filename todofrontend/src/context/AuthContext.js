import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    // Only set the user if BOTH the token and user data exist
    if (savedUser && token) {
      try { 
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.clear(); 
      }
    }
    setLoading(false); // Done checking localStorage
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};