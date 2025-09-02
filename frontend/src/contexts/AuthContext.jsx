import React, { createContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimeout = useRef(null);
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // On mount, check for token and user info
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('AuthContext - token found:', !!token);
      
      if (token) {
        try {
          const decoded = jwtDecode(token);
          console.log('AuthContext - decoded token:', decoded);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            console.log('AuthContext - token expired, logging out');
            localStorage.removeItem('token');
            setUser(null);
          } else {
            // Validate token with backend
            const isValid = await validateToken(token);
            if (isValid) {
              setUser({ ...decoded, token });
              console.log('AuthContext - user set:', { ...decoded, token });
            } else {
              console.log('AuthContext - token invalid, logging out');
              localStorage.removeItem('token');
              setUser(null);
            }
          }
        } catch (error) {
          console.log('AuthContext - token decode error:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log('AuthContext - no token found');
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Inactivity logout logic
  useEffect(() => {
    function resetInactivityTimer() {
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
      if (user) {
        inactivityTimeout.current = setTimeout(() => {
          logout();
        }, INACTIVITY_LIMIT);
      }
    }

    // List of events that indicate user activity
    const activityEvents = [
      'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'
    ];

    // Attach event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start timer if user is logged in
    if (user) {
      resetInactivityTimer();
    }

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
    };
  }, [user]);

  const validateToken = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/validate-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.valid;
      }
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 