import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "@/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/me", { withCredentials: true });
      setUser(res.data);
    } catch (err) {
      // not logged in or session invalid
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    const res = await axios.post("/auth/login", credentials, {
      withCredentials: true,
    });
    await fetchUser(); // refresh user after login
    return res;
  };

  const logout = async () => {
    await axios.post("/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
