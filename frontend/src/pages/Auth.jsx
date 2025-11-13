import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx"; // <- com extensão
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/perfis";

  // login
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [lLoading, setLLoading] = useState(false);
  const [lErr, setLErr] = useState("");

  // registro + card mínimo
  const [rUser, setRUser] = useState("");
  const [rPass, setRPass] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [area, setArea] = useState("Desenvolvimento");
  const [sLoading, setSLoading] = useState(false);
  const [sErr, setSErr] = useState("");

  function switchTab(next) {
    setTab(next);
    setLErr("");
    setSErr("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLErr("");
    if (!lUser || !lPass) {
      setLErr("Informe usuário e senha.");
      return;
    }
    try {
      setLLoading(true);
      await login(lUser, lPass);
      navigate(from, { replace: true });
    } catch (err) {
      setLErr(err?.response?.data?.error || "Erro ao entrar");
    } finally {
      setLLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSErr("");

    if (!rUser || !rPass) {
      setSErr("Informe usuário e senha.");
      return;
    }
    if (!nome || !cargo) {
      setSErr("Informe ao menos Nome e Cargo para o card.");
      return;
    }

    const profile = {
      nome,
      cargo,
      localizacao,
      area,
      resumo: "",
      foto: "https://i.pravatar.cc/150",
      habilidadesTecnicas: [],
      softSkills: [],
      experiencias: [],
      formacao: [],
      projetos: [],
      certificacoes: [],
      idiomas: [],
      areasInteresse: [],
    };

    try {
      setSLoading(true);
      await register(rUser, rPass);
      await login(rUser, rPass); // garante token salvo

      const base = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${base}/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Falha ao criar o card");
      }

      navigate("/perfis", { replace: true });
    } catch (err) {
      setSErr(err?.message || err?.error || "Erro ao registrar");
    } finally {
      setSLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-skill-primary via-skill-ink to-skill-primary/90"></div>
      <div className="absolute -top-24 -right-24 h-[32rem] w-[32rem] rounded-full bg-skill-accent/20 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"></div>

      <div className="relative z-10 grid place-items-center px-4 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
          {/* Esquerda: hero + logo simples */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="text-center">
              <img
                src="/skillup-logo.png"
                alt="SkillUp IA"
                className="h-24 w-24 mx-auto"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <h1 className="mt-6 text-3xl font-semibold text-white">
                Conecte talentos. Potencialize times.
              </h1>
              <p className="mt-3 text-white/80">
                Encontre profissionais por habilidades, área e localização — rápido e com estilo.
              </p>
            </div>
          </div>

          {/* Card de autenticação */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-soft p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/skillup-logo.png"
                  alt="SkillUp"
                  className="h-9 w-9"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <span className="font-semibold">SkillUp IA</span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 rounded-lg p-1">
                <button
                  onClick={() => switchTab("login")}
                  className={`px-3 py-1.5 rounded-md text-sm ${tab==="login" ? "bg-white shadow" : "text-zinc-600"}`}
                >Login</button>
                <button
                  onClick={() => switchTab("signup")}
                  className={`px-3 py-1.5 rounded-md text-sm ${tab==="signup" ? "bg-white shadow" : "text-zinc-600"}`}
                >Criar Perfil</button>
              </div>
            </div>

            {tab === "login" && (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-zinc-600">Usuário ou e-mail</label>
                  <input
                    value={lUser} onChange={e=>setLUser(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-600">Senha</label>
                  <input
                    type="password" value={lPass} onChange={e=>setLPass(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                {lErr && <p className="text-sm text-red-600">{lErr}</p>}
                <button
                  disabled={lLoading}
                  className="w-full py-2 rounded-xl bg-skill-accent text-white hover:opacity-95 disabled:opacity-60"
                >
                  {lLoading ? "Entrando…" : "Entrar"}
                </button>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignup} className="mt-6 grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600">Usuário</label>
                    <input value={rUser} onChange={e=>setRUser(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600">Senha</label>
                    <input type="password" value={rPass} onChange={e=>setRPass(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600">Nome (card)</label>
                    <input value={nome} onChange={e=>setNome(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600">Cargo</label>
                    <input value={cargo} onChange={e=>setCargo(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600">Localização</label>
                    <input value={localizacao} onChange={e=>setLocalizacao(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600">Área</label>
                    <input value={area} onChange={e=>setArea(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-100 outline-none" />
                  </div>
                </div>

                {sErr && <p className="text-sm text-red-600">{sErr}</p>}

                <button
                  disabled={sLoading}
                  className="mt-2 w-full py-2 rounded-xl bg-skill-primary text-white hover:opacity-95 disabled:opacity-60"
                >
                  {sLoading ? "Criando conta…" : "Criar conta e card"}
                </button>
                <p className="text-xs text-zinc-500">
                  O card é criado automaticamente e adicionado ao final da lista.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
