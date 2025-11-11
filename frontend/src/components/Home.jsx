// src/components/Home.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import anime from 'animejs'

import Card from './Card.jsx'
import Modal from './Modal.jsx'
import AuthBar from './AuthBar.jsx'
import { fetchProfiles, aiSuggest, API_URL } from '../lib/api.js'

export default function Home() {
  const location = useLocation()

  const [data, setData] = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)

  const [q, setQ] = useState('')
  const [cidade, setCidade] = useState('Todas')
  const [area, setArea] = useState('Todas')
  const [tech, setTech] = useState('Todas')

  const [loading, setLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const gridRef = useRef(null)

  // ========= TEMA (persistência + sync com <html>) =========
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  // Carrega dados (API -> /data/profiles.json -> /profiles.json)
  useEffect(() => {
    ;(async () => {
      setErrMsg('')
      setLoading(true)
      try {
        const res = await fetchProfiles({ pageSize: 60 })
        const list = Array.isArray(res) ? res : res.items ?? []
        if (!list.length) throw new Error('API vazia')
        setData(list)
      } catch {
        try {
          const r = await fetch(`${API_URL}/data/profiles.json`, { cache: 'no-store' })
          const local = await r.json()
          setData(local)
        } catch {
          try {
            const r2 = await fetch('/profiles.json', { cache: 'no-store' })
            const local2 = await r2.json()
            setData(local2)
          } catch {
            setErrMsg(
              'Não foi possível carregar os perfis. Inicie o backend (http://localhost:3000) ou coloque profiles.json em /public.'
            )
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [location.search])

  // Animações
  useEffect(() => {
    anime({
      targets: '#topbar',
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 500,
      easing: 'easeOutQuad'
    })
  }, [])

  useEffect(() => {
    if (!gridRef.current) return
    anime({
      targets: '#cards-grid > *',
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 450,
      delay: anime.stagger(45),
      easing: 'easeOutQuad'
    })
  }, [data, q, cidade, area, tech])

  // Listas de filtros
  const cidades = useMemo(() => ['Todas', ...new Set(data.map(p => p.localizacao))], [data])
  const areas = useMemo(() => ['Todas', ...new Set(data.map(p => p.area))], [data])
  const techs = useMemo(() => {
    const all = data.flatMap(p => p.habilidadesTecnicas || [])
    return ['Todas', ...new Set(all)]
  }, [data])

  // Busca + filtros
  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase()
    return data.filter(p => {
      const matchBusca =
        !s ||
        p.nome?.toLowerCase().includes(s) ||
        p.cargo?.toLowerCase().includes(s) ||
        (p.habilidadesTecnicas || []).some(t => t.toLowerCase().includes(s))

      const matchCidade = cidade === 'Todas' || p.localizacao === cidade
      const matchArea = area === 'Todas' || p.area === area
      const matchTech = tech === 'Todas' || (p.habilidadesTecnicas || []).includes(tech)

      return matchBusca && matchCidade && matchArea && matchTech
    })
  }, [data, q, cidade, area, tech])

  // IA: sugestões simples com base no filtro atual
  async function handleSuggest() {
    try {
      setSuggesting(true)
      const skills = tech !== 'Todas' ? [tech] : q ? [q] : []
      if (!skills.length) return alert('Selecione uma tecnologia ou digite algo na busca.')
      const res = await aiSuggest({
        skills,
        area: area === 'Todas' ? '' : area,
        city: cidade === 'Todas' ? '' : cidade,
        k: 6
      })
      if (res?.items?.length) setData(res.items)
      else alert('Sem sugestões para esses parâmetros.')
    } catch (e) {
      console.error(e)
      alert('Erro ao obter sugestões da IA.')
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header
        id="topbar"
        className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-b border-zinc-200 dark:border-zinc-800"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
          <h1 className="font-semibold text-lg flex-1">SkillUp IA</h1>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, cargo ou tecnologia..."
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
          />

          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="px-2 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800"
          >
            {cidades.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="px-2 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800"
          >
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>

          <select
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="px-2 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800"
          >
            {techs.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <button
            onClick={toggleTheme}
            className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm transition hover:opacity-80"
          >
            Alternar tema {theme === 'dark' ? '🌙' : '🌞'}
          </button>

          <button
            onClick={handleSuggest}
            disabled={suggesting}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm hover:opacity-90 disabled:opacity-60"
          >
            {suggesting ? 'Gerando…' : 'Sugestões da IA'}
          </button>

          <Link
            to="/register"
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:opacity-90"
          >
            Criar Perfil
          </Link>

          <AuthBar />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <p className="text-center text-zinc-500 dark:text-zinc-400">Carregando…</p>
        )}

        {!loading && errMsg && <p className="text-center text-red-600">{errMsg}</p>}

        {!loading && !errMsg && (
          <>
            {filtrados.length === 0 ? (
              <p className="text-center text-zinc-500 dark:text-zinc-400">
                Nenhum profissional encontrado.
              </p>
            ) : (
              <div id="cards-grid" ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtrados.map((p) => (
                  <Card
                    key={p.id}
                    profile={p}
                    onOpen={(prof) => {
                      setSelected(prof)
                      setOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Modal open={open} data={selected} onClose={() => setOpen(false)} />
    </div>
  )
}
