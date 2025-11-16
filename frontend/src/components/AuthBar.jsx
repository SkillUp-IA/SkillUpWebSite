// src/components/AuthBar.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthBar() {
  const { isAuth, username, login, register, logout } = useAuth()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  async function doLogin() {
    try {
      setLoading(true)
      await login(user, pass)
      setUser('')
      setPass('')
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Falha ao entrar')
    } finally {
      setLoading(false)
    }
  }

  async function doRegister() {
    try {
      setLoading(true)
      await register(user, pass)
      setUser('')
      setPass('')
      alert('Usuário registrado! Você já pode entrar.')
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Falha ao registrar')
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') doLogin()
  }

  if (isAuth) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">
          Olá, <b>{username}</b>
        </span>
        <button
          type="button"
          onClick={logout}
          className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm hover:opacity-90"
        >
          Sair
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="authbar-user">Usuário</label>
      <input
        id="authbar-user"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="usuário"
        className="px-2 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800 outline-none"
        autoComplete="username"
      />

      <label className="sr-only" htmlFor="authbar-pass">Senha</label>
      <input
        id="authbar-pass"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="senha"
        className="px-2 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800 outline-none"
        autoComplete="current-password"
      />

      <button
        type="button"
        onClick={doLogin}
        disabled={loading}
        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:opacity-95 disabled:opacity-60"
        aria-label="Entrar"
      >
        Entrar
      </button>

      <button
        type="button"
        onClick={doRegister}
        disabled={loading}
        className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm hover:opacity-90 disabled:opacity-60"
        aria-label="Registrar"
      >
        Registrar
      </button>
    </div>
  )
}
