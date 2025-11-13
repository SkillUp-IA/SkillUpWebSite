// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, createProfile } from '../lib/api.js';

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem('username', username);
    else localStorage.removeItem('username');
  }, [username]);

  async function login(user, pass) {
    const res = await apiLogin(user, pass); // { message, token }
    setToken(res.token);
    setUsername(user);
    return res;
  }

  // registra -> loga -> cria o card (se profile vier)
  async function register(user, pass, profile) {
    await apiRegister(user, pass);
    const logged = await apiLogin(user, pass);
    setToken(logged.token);
    setUsername(user);
    if (profile) await createProfile(profile);
    return true;
  }

  function logout() {
    setToken('');
    setUsername('');
  }

  return (
    <AuthCtx.Provider value={{ token, username, isAuth: !!token, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
