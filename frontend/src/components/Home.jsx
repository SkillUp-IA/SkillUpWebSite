import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import anime from "animejs";

import Card from "./Card.jsx";
import Modal from "./Modal.jsx";
import Brand from "./Brand.jsx";
import { fetchProfiles, API_URL } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ESTADOS_BRASIL = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

const RECO_STORAGE_KEY = "skillup_recomendados";

// helper pra pegar a UF a partir de "Cidade - SP" ou "SP"
function getUF(localizacao) {
  if (!localizacao) return "";
  const parts = String(localizacao)
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (last.length === 2) return last.toUpperCase();
  }
  if (parts[0] && parts[0].length === 2) {
    return parts[0].toUpperCase();
  }
  return "";
}

export default function Home() {
  const location = useLocation();
  const { isAuth, username, login, register, logout } = useAuth();

  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [area, setArea] = useState("Todos");
  const [tech, setTech] = useState("Todos");

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState([]);

  const gridRef = useRef(null);

  // estado da barrinha de login rápido
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ======== Tema ========
  const getInitialTheme = () => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  // ======== Auth bar handlers ========
  async function handleQuickLogin() {
    try {
      setAuthLoading(true);
      await login(authUser, authPass);
      setAuthUser("");
      setAuthPass("");
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Falha ao entrar");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleQuickRegister() {
    try {
      setAuthLoading(true);
      await register(authUser, authPass);
      setAuthUser("");
      setAuthPass("");
      alert("Usuário registrado! Você já pode entrar.");
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Falha ao registrar");
    } finally {
      setAuthLoading(false);
    }
  }

  function authKeyDown(e) {
    if (e.key === "Enter") handleQuickLogin();
  }

  // ======== Carrega perfis ========
  useEffect(() => {
    (async () => {
      setErrMsg("");
      setLoading(true);
      try {
        const res = await fetchProfiles({ pageSize: 500 });
        const list = Array.isArray(res) ? res : res.items ?? [];
        if (!list.length) throw new Error("API vazia");
        setData(list);
      } catch {
        try {
          const r = await fetch(`${API_URL}/data/profiles.json`, {
            cache: "no-store",
          });
          const local = await r.json();
          setData(local);
        } catch {
          try {
            const r2 = await fetch("/profiles.json", { cache: "no-store" });
            const local2 = await r2.json();
            setData(local2);
          } catch {
            setErrMsg(
              "Não foi possível carregar os perfis. Inicie o backend (http://localhost:3000) ou coloque profiles.json em /public."
            );
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  // ======== Recomendações no localStorage ========
  function loadRecommendedFromStorage() {
    try {
      const raw = localStorage.getItem(RECO_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      setRecommendedIds(list);
      return list;
    } catch (e) {
      console.error("Erro ao carregar recomendações locais", e);
      setRecommendedIds([]);
      return [];
    }
  }

  useEffect(() => {
    loadRecommendedFromStorage();
  }, []);

  // ======== Animações ========
  useEffect(() => {
    anime({
      targets: "#topbar",
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 500,
      easing: "easeOutQuad",
    });
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    anime({
      targets: "#cards-grid > *",
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 450,
      delay: anime.stagger(45),
      easing: "easeOutQuad",
    });
  }, [data, q, estado, area, tech, recommendedOnly, recommendedIds]);

  // ======== Listas de filtro ========
  const areas = useMemo(
    () => ["Todos", ...new Set(data.map((p) => p.area).filter(Boolean))],
    [data]
  );

  const techs = useMemo(() => {
    const all = data.flatMap((p) => p.habilidadesTecnicas || []);
    return ["Todos", ...new Set(all)];
  }, [data]);

  // ======== Filtro principal ========
  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();

    let result = data.filter((p) => {
      const matchBusca =
        !s ||
        p.nome?.toLowerCase().includes(s) ||
        p.cargo?.toLowerCase().includes(s) ||
        (p.habilidadesTecnicas || []).some((t) =>
          t.toLowerCase().includes(s)
        );

      const uf = getUF(p.localizacao);
      const matchEstado = estado === "Todos" || uf === estado;

      const matchArea = area === "Todos" || p.area === area;
      const matchTech =
        tech === "Todos" || (p.habilidadesTecnicas || []).includes(tech);

      return matchBusca && matchEstado && matchArea && matchTech;
    });

    if (recommendedOnly && recommendedIds.length) {
      const setIds = new Set(recommendedIds);
      result = result.filter((p) => setIds.has(p.id));
    }

    return result;
  }, [data, q, estado, area, tech, recommendedOnly, recommendedIds]);

  function handleToggleRecommended() {
    const list = loadRecommendedFromStorage();
    if (!list.length) {
      alert(
        "Você ainda não recomendou nenhum profissional.\nAbra um card, clique em 'Recomendar profissional' e depois volte aqui."
      );
      setRecommendedOnly(false);
      return;
    }
    setRecommendedOnly((prev) => !prev);
  }

  // ======== JSX ========
  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b
        from-slate-50 via-slate-100 to-sky-50
        text-slate-900
        dark:from-slate-950 dark:via-slate-950 dark:to-slate-900
        dark:text-slate-50
        overflow-x-hidden
      "
    >
      {/* TOPBAR */}
      <header
        id="topbar"
        className="
          sticky top-0 z-40
          border-b border-slate-200
          bg-white/80
          backdrop-blur-md
          dark:border-slate-800/80
          dark:bg-slate-950/95
        "
      >
        {/* Linha 1: logo + ações */}
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Brand size={40} subtitle="Plataforma inteligente de talentos" />
            <div className="hidden sm:flex flex-col text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                Conecte profissionais, oportunidades e aprendizado contínuo.
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              to="/meu-plano"
              className="
                inline-flex items-center justify-center
                px-3 py-2 rounded-xl text-xs sm:text-sm font-medium
                bg-emerald-500 text-slate-950 hover:bg-emerald-400
                border border-emerald-400/80
                transition
              "
            >
              Meu plano
            </Link>

            <button
              onClick={toggleTheme}
              className="
                px-3 py-2 rounded-xl text-xs sm:text-sm font-medium
                bg-slate-100 text-slate-800 border border-slate-300
                hover:bg-slate-200
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700
                dark:hover:bg-slate-800
                transition
              "
            >
              Tema {theme === "dark" ? "claro" : "escuro"}
            </button>

            <Link
              to="/auth"
              className="
                px-3 py-2 rounded-xl text-xs sm:text-sm font-medium
                bg-sky-500 text-slate-950 hover:bg-sky-400
                shadow-lg shadow-sky-500/40
                transition
              "
            >
              Criar perfil
            </Link>

            {/* Barra de auth embutida */}
            {isAuth ? (
              <div className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                <span>
                  Olá, <b>{username}</b>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="
                      px-3 py-2 text-xs sm:text-sm rounded-xl
                      bg-slate-200 text-slate-900
                      dark:bg-slate-800 dark:text-slate-100
                      hover:opacity-90
                  "
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
                <label className="sr-only" htmlFor="authbar-user">
                  Usuário
                </label>
                <input
                  id="authbar-user"
                  value={authUser}
                  onChange={(e) => setAuthUser(e.target.value)}
                  onKeyDown={authKeyDown}
                  placeholder="usuário"
                  className="
                    px-3 py-2 text-xs sm:text-sm rounded-xl
                    bg-slate-900/90 border border-slate-700
                    text-slate-50 placeholder:text-slate-400
                    outline-none
                    focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    w-[44%] sm:w-auto min-w-[100px] max-w-[140px]
                  "
                  autoComplete="username"
                />

                <label className="sr-only" htmlFor="authbar-pass">
                  Senha
                </label>
                <input
                  id="authbar-pass"
                  type="password"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  onKeyDown={authKeyDown}
                  placeholder="senha"
                  className="
                    px-3 py-2 text-xs sm:text-sm rounded-xl
                    bg-slate-900/90 border border-slate-700
                    text-slate-50 placeholder:text-slate-400
                    outline-none
                    focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                    w-[44%] sm:w-auto min-w-[100px] max-w-[140px]
                  "
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={authLoading}
                  className="
                    px-3 py-2 text-xs sm:text-sm rounded-xl
                    bg-emerald-500 text-slate-950
                    hover:bg-emerald-400
                    disabled:opacity-60
                  "
                  aria-label="Entrar"
                >
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={handleQuickRegister}
                  disabled={authLoading}
                  className="
                    px-3 py-2 text-xs sm:text-sm rounded-xl
                    bg-slate-800 text-slate-100
                    hover:bg-slate-700
                    disabled:opacity-60
                  "
                  aria-label="Registrar"
                >
                  Registrar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Linha 2: hero + badges + filtros */}
        <div className="max-w-6xl mx-auto px-4 pb-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Encontre o perfil certo para cada desafio
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                Use a busca e os filtros para localizar talentos por nome, área,
                estado ou tecnologia.
              </p>
            </div>

            <div className="flex gap-2 text-[11px]">
              <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
                <span className="block text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Estados
                </span>
                <span>{ESTADOS_BRASIL.length}+ regiões mapeadas</span>
              </div>
              <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
                <span className="block text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  IA
                </span>
                <span>Use recomendações para filtrar favoritos</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid gap-2 sm:gap-3 md:grid-cols-12 items-center">
            {/* Busca */}
            <div className="md:col-span-5 lg:col-span-6">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, cargo ou tecnologia..."
                className="
                  w-full px-3 py-2 rounded-xl text-xs sm:text-sm
                  bg-slate-900 border border-slate-700
                  text-slate-50 placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                  dark:bg-slate-900 dark:border-slate-700
                "
              />
            </div>

            {/* Estado */}
            <div className="md:col-span-3 lg:col-span-2">
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="
                  w-full px-2 py-2 rounded-xl text-xs sm:text-sm
                  bg-slate-900 border border-slate-700
                  text-slate-50
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                  dark:bg-slate-900 dark:border-slate-700
                "
              >
                <option value="Todos">Todos os estados</option>
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>
                    {uf.sigla} - {uf.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Área */}
            <div className="md:col-span-2 lg:col-span-2">
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="
                  w-full px-2 py-2 rounded-xl text-xs sm:text-sm
                  bg-slate-900 border border-slate-700
                  text-slate-50
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                  dark:bg-slate-900 dark:border-slate-700
                "
              >
                {areas.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Tech */}
            <div className="md:col-span-2 lg:col-span-2">
              <select
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                className="
                  w-full px-2 py-2 rounded-xl text-xs sm:text-sm
                  bg-slate-900 border border-slate-700
                  text-slate-50
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                  dark:bg-slate-900 dark:border-slate-700
                "
              >
                {techs.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Botão IA */}
            <div className="md:col-span-12 lg:col-span-2 flex md:justify-end">
              <button
                onClick={handleToggleRecommended}
                className={`w-full lg:w-auto px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                  recommendedOnly
                    ? "bg-emerald-700 text-slate-50"
                    : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                }`}
              >
                {recommendedOnly ? "Ver todos" : "Sugestões da IA"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <p className="text-center text-slate-400">Carregando perfis...</p>
        )}

        {!loading && errMsg && (
          <p className="text-center text-red-400">{errMsg}</p>
        )}

        {!loading && !errMsg && (
          <>
            <div className="mb-5 flex items-baseline justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold">
                Profissionais em destaque
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filtrados.length} perfil
                {filtrados.length === 1 ? "" : "s"} encontrado
                {filtrados.length === 1 ? "" : "s"}.
              </p>
            </div>

            {filtrados.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-300 space-y-2">
                <p>Nenhum profissional encontrado para esses filtros.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Tente remover algum filtro ou buscar por outra tecnologia.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Você também pode{" "}
                  <Link
                    to="/auth"
                    className="text-sky-500 hover:underline font-medium"
                  >
                    criar seu perfil
                  </Link>{" "}
                  e ser o primeiro dessa região.
                </p>
              </div>
            ) : (
              <div
                id="cards-grid"
                ref={gridRef}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtrados.map((p) => (
                  <Card
                    key={p.id}
                    profile={p}
                    onOpen={(prof) => {
                      setSelected(prof);
                      setOpen(true);
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
  );
}
