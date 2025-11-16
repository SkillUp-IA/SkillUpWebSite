// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { login as apiLogin, register as apiRegister, createProfile } from '../lib/api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '')

  // Persistência reativa (fallback; mas escrevemos também imediatamente no login/register)
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (username) localStorage.setItem('username', username)
    else localStorage.removeItem('username')
  }, [username])

  // Mantém abas/janelas sincronizadas
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'token') setToken(localStorage.getItem('token') || '')
      if (e.key === 'username') setUsername(localStorage.getItem('username') || '')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function login(user, pass) {
    try {
      const res = await apiLogin(user, pass) // { message, token }
      if (!res?.token) throw new Error('Falha no login')
      // grava imediatamente p/ próximas requisições que leem do localStorage
      localStorage.setItem('token', res.token)
      localStorage.setItem('username', user)
      setToken(res.token)
      setUsername(user)
      return res
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao entrar'
      throw new Error(msg)
    }
  }

  // registra -> loga -> (opcional) cria o card usando o token recém gravado
  async function register(user, pass, profile) {
    try {
      await apiRegister(user, pass)
      const logged = await apiLogin(user, pass) // { token }
      if (!logged?.token) throw new Error('Falha no login após registro')
      // grava imediatamente
      localStorage.setItem('token', logged.token)
      localStorage.setItem('username', user)
      setToken(logged.token)
      setUsername(user)
      // cria perfil se fornecido
      if (profile) await createProfile(profile)
      return true
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao registrar'
      throw new Error(msg)
    }
  }

  function logout() {
    // limpa imediatamente
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken('')
    setUsername('')
  }

  const value = useMemo(
    () => ({
      token,
      username,
      isAuth: !!token,
      login,
      register,
      logout,
    }),
    [token, username]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
