// src/pages/Register.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import anime from 'animejs'
import { useAuth } from '../context/AuthContext.jsx'
import {
  register as apiRegister,
  login as apiLogin,
  createProfile,
  aiExtract,
  aiSummary,
  aiSuggest,
  uploadPhoto,
} from '../lib/api.js'

function Tags({ label, items, setItems, placeholder = 'Digite e tecle Enter' }) {
  const [v, setV] = useState('')
  function onKeyDown(e) {
    if (e.key === 'Enter' && v.trim()) {
      const value = v.trim()
      if (!items.includes(value)) setItems([...items, value])
      setV('')
    }
  }
  return (
    <div className="space-y-1">
      <label className="text-sm text-zinc-500">{label}</label>
      <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center gap-1"
            >
              {t}
              <button
                type="button"
                onClick={() => setItems(items.filter(x => x !== t))}
                className="text-zinc-500 hover:text-red-600"
                aria-label={`remover ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={v}
            onChange={e => setV(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-40 bg-transparent outline-none text-sm px-1"
          />
        </div>
      </div>
    </div>
  )
}

function ObjList({ label, items, setItems, schema }) {
  function add() {
    setItems([...items, { ...schema }])
  }
  function remove(i) {
    setItems(items.filter((_, idx) => idx !== i))
  }
  function update(i, key, val) {
    const next = [...items]
    next[i] = { ...next[i], [key]: val }
    setItems(next)
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{label}</h3>
        <button
          type="button"
          onClick={add}
          className="text-sm px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
        >
          + adicionar
        </button>
      </div>
      {items.length === 0 && <p className="text-sm text-zinc-500">Nenhum item</p>}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.keys(schema).map(k => (
                <input
                  key={k}
                  value={it[k] ?? ''}
                  onChange={e => update(i, k, e.target.value)}
                  placeholder={k}
                  className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
                />
              ))}
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-sm text-red-600 hover:underline"
              >
                remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { login: authLogin, isAuth } = useAuth()
  const nav = useNavigate()

  // Se já estiver logado e cair aqui, manda para /perfis
  useEffect(() => {
    if (isAuth) nav('/perfis', { replace: true })
  }, [isAuth, nav])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [nome, setNome] = useState('')
  const [foto, setFoto] = useState('https://i.pravatar.cc/150')
  const [cargo, setCargo] = useState('')
  const [resumo, setResumo] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [area, setArea] = useState('Desenvolvimento')

  const [habilidadesTecnicas, setHabilidadesTecnicas] = useState([])
  const [softSkills, setSoftSkills] = useState([])
  const [experiencias, setExperiencias] = useState([])
  const [formacao, setFormacao] = useState([])
  const [projetos, setProjetos] = useState([])
  const [certificacoes, setCertificacoes] = useState([])
  const [idiomas, setIdiomas] = useState([])
  const [areasInteresse, setAreasInteresse] = useState([])

  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    anime({
      targets: '.register-animate',
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 450,
      easing: 'easeOutQuad',
    })
  }, [])

  function toggleTheme() {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    if (isDark) {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  const gallery = Array.from({ length: 12 }, (_, i) => `https://i.pravatar.cc/150?img=${i + 10}`)

  async function onUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const { url } = await uploadPhoto(file)
      setFoto(url)
    } catch (err) {
      alert('Falha no upload de imagem.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAISmartFill() {
    try {
      setAiLoading(true)
      const baseText = `${cargo}. ${resumo}`

      const extract = await aiExtract(baseText)
      if (extract?.habilidadesTecnicas?.length) {
        setHabilidadesTecnicas(prev => Array.from(new Set([...prev, ...extract.habilidadesTecnicas])))
      }
      if (extract?.softSkills?.length) {
        setSoftSkills(prev => Array.from(new Set([...prev, ...extract.softSkills])))
      }
      if (extract?.area) setArea(extract.area)

      const sum = await aiSummary({
        nome, cargo, resumo, localizacao, area,
        habilidadesTecnicas, softSkills,
      })
      if (sum?.resumo) setResumo(sum.resumo)
      if (sum?.skillsSugeridas?.length) {
        setHabilidadesTecnicas(prev => Array.from(new Set([...prev, ...sum.skillsSugeridas])))
      }
    } catch (e) {
      console.error(e)
      alert('IA indisponível no momento.')
    } finally {
      setAiLoading(false)
    }
  }

  async function previewMatches() {
    try {
      setAiLoading(true)
      const r = await aiSuggest({
        skills: habilidadesTecnicas.slice(0, 2),
        area,
        city: localizacao,
        k: 5,
      })
      setAiMatches(r.items || [])
    } catch (e) {
      console.error(e)
      setAiMatches([])
    } finally {
      setAiLoading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (password !== confirm) return alert('Senhas diferentes')
    if (!username || !password) return alert('Informe usuário e senha')
    if (!nome || !cargo) return alert('Informe nome e cargo')

    const profile = {
      nome,
      foto,
      cargo,
      resumo,
      localizacao,
      area,
      habilidadesTecnicas,
      softSkills,
      experiencias,
      formacao,
      projetos,
      certificacoes,
      idiomas,
      areasInteresse,
    }

    try {
      setSubmitting(true)
      await apiRegister(username, password)
      const { token } = await apiLogin(username, password)
      if (!token) throw new Error('Falha no login automático')

      // atualiza contexto + localStorage
      await authLogin(username, password)

      // cria o card no JSON
      await createProfile(profile)

      alert('Perfil criado com sucesso!')
      nav('/perfis') // ← vai para a lista de cards
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.error || err.message || 'Erro ao criar perfil')
    } finally {
      setSubmitting(false)
    }
  }

  const areasOpts = ['Desenvolvimento', 'Dados', 'Design', 'Infraestrutura', 'Sistemas']

  const preview = {
    id: 0,
    nome,
    foto,
    cargo,
    resumo,
    localizacao,
    area,
    habilidadesTecnicas,
    softSkills,
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Criar conta + Perfil</h1>
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm"
        >
          Alternar tema 🌞🌙
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10 grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <form
          onSubmit={onSubmit}
          className="register-animate rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow space-y-6"
        >
          {/* Conta */}
          <section className="space-y-3">
            <h2 className="font-medium">Conta</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Usuário"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmar senha"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none sm:col-span-2"
              />
            </div>
          </section>

          {/* Perfil básico */}
          <section className="space-y-3">
            <h2 className="font-medium">Perfil</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome completo"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none sm:col-span-2"
              />
              <input
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Cargo / Profissão"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
              />
              <input
                value={localizacao}
                onChange={e => setLocalizacao(e.target.value)}
                placeholder="Cidade - UF"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
              />
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none sm:col-span-2"
              >
                {areasOpts.map(a => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <textarea
                value={resumo}
                onChange={e => setResumo(e.target.value)}
                rows={3}
                placeholder="Sobre mim / Resumo"
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none sm:col-span-2"
              />
            </div>

            {/* Foto */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-zinc-500">URL da foto</label>
                <input
                  value={foto}
                  onChange={e => setFoto(e.target.value)}
                  placeholder="https://..."
                  className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
                />
                <label className="text-sm text-zinc-500">Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  className="block text-sm file:mr-3 file:px-3 file:py-2 file:rounded-xl file:bg-zinc-100 dark:file:bg-zinc-800"
                />
                {uploading && <p className="text-xs text-zinc-500">Enviando...</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-500">Galeria</label>
                <div className="grid grid-cols-6 gap-2">
                  {gallery.map((g, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFoto(g)}
                      className={`rounded overflow-hidden border ${
                        foto === g ? 'border-emerald-500' : 'border-transparent'
                      }`}
                    >
                      <img src={g} className="h-12 w-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Arrays principais */}
          <Tags
            label="Habilidades técnicas"
            items={habilidadesTecnicas}
            setItems={setHabilidadesTecnicas}
            placeholder="Ex.: React, Docker, SQL"
          />
          <Tags
            label="Soft skills"
            items={softSkills}
            setItems={setSoftSkills}
            placeholder="Ex.: Comunicação, Liderança"
          />

          <ObjList
            label="Experiências"
            items={experiencias}
            setItems={setExperiencias}
            schema={{ empresa: '', cargo: '', inicio: '', fim: '', descricao: '' }}
          />

          <ObjList
            label="Formação"
            items={formacao}
            setItems={setFormacao}
            schema={{ curso: '', instituicao: '', ano: '' }}
          />

          <ObjList
            label="Projetos"
            items={projetos}
            setItems={setProjetos}
            schema={{ titulo: '', link: '', descricao: '' }}
          />

          <Tags
            label="Certificações"
            items={certificacoes}
            setItems={setCertificacoes}
            placeholder="Ex.: AZ-900, AWS CCP"
          />

          <ObjList
            label="Idiomas"
            items={idiomas}
            setItems={setIdiomas}
            schema={{ idioma: '', nivel: '' }}
          />

          <Tags
            label="Áreas de interesse"
            items={areasInteresse}
            setItems={setAreasInteresse}
            placeholder="Ex.: Sustentabilidade, Esportes"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAISmartFill}
              disabled={aiLoading}
              className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-60"
            >
              {aiLoading ? 'Processando…' : 'Preencher com IA (skills/área/resumo)'}
            </button>
            <button
              type="button"
              onClick={previewMatches}
              disabled={aiLoading}
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-60"
            >
              {aiLoading ? 'Buscando…' : 'Ver possíveis conexões'}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium disabled:opacity-60"
          >
            {submitting ? 'Criando…' : 'Criar conta + Card'}
          </button>
        </form>

        {/* Pré-visualização do Card */}
        <div className="register-animate rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow h-max">
          <h2 className="text-lg font-semibold mb-4">Pré-visualização</h2>
          <div className="w-full text-left rounded-2xl shadow p-4 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-4">
              <img src={preview.foto} alt={preview.nome} className="h-16 w-16 rounded-full object-cover" />
              <div>
                <h3 className="font-semibold text-lg">{preview.nome || 'Seu nome'}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{preview.cargo || 'Seu cargo'}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {(preview.localizacao || 'Cidade - UF')} • {(preview.area || 'Área')}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 line-clamp-3">
              {preview.resumo || 'Resumo do seu perfil aparecerá aqui.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(preview.habilidadesTecnicas || []).slice(0, 3).map((t, i) => (
                <span key={`${t}-${i}`} className="px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            Ao enviar, seu card entra automaticamente na Home.
          </p>
        </div>
      </div>
    </div>
  )
}
