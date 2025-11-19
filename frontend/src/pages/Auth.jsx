// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { createProfile } from "../lib/api.js";
import Brand from "../components/Brand.jsx";

// Campo de tags simples (habilidades, interesses etc.)
function Tags({ label, items, setItems, placeholder = "Digite e tecle Enter" }) {
  const [v, setV] = useState("");

  function onKeyDown(e) {
    if (e.key === "Enter" && v.trim()) {
      const value = v.trim();
      if (!items.includes(value)) setItems([...items, value]);
      setV("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="ui-label">{label}</span>
        <span className="ui-badge">Campo de lista</span>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2">
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="px-2 py-1 text-xs rounded-full bg-slate-800 border border-slate-700 flex items-center gap-1"
            >
              {t}
              <button
                type="button"
                onClick={() => setItems(items.filter((x) => x !== t))}
                className="text-slate-400 hover:text-red-400"
                aria-label={`remover ${t}`}
              >
                x
              </button>
            </span>
          ))}
          <input
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-40 bg-transparent outline-none text-sm px-1 text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>
      <p className="ui-hint">
        Tecle Enter para adicionar cada item.
      </p>
    </div>
  );
}

// Lista de objetos (experiencias, formacao, projetos, idiomas)
function ObjList({ label, items, setItems, schema, hint }) {
  function add() {
    setItems([...items, { ...schema }]);
  }
  function remove(i) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function update(i, key, val) {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    setItems(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="ui-label">{label}</span>
        <button
          type="button"
          onClick={add}
          className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          + adicionar
        </button>
      </div>

      {items.length === 0 && (
        <p className="ui-hint">Nenhum item adicionado ainda.</p>
      )}

      <div className="space-y-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="grid sm:grid-cols-2 gap-2">
              {Object.keys(schema).map((k) => (
                <input
                  key={k}
                  value={it[k] ?? ""}
                  onChange={(e) => update(i, k, e.target.value)}
                  placeholder={k}
                  className="ui-input text-slate-100 placeholder:text-slate-500"
                />
              ))}
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-red-400 hover:underline"
              >
                remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {hint && <p className="ui-hint">{hint}</p>}
    </div>
  );
}

// Painel azul de cada passo
function StepPanel({ badge, title, children }) {
  return (
    <section
      className="
        rounded-2xl
        border border-slate-800/90
        bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-sky-950/40
        shadow-lg shadow-sky-900/40
        px-4 sm:px-5 py-4 sm:py-5
        space-y-4
      "
    >
      {(badge || title) && (
        <div className="flex items-center gap-2 mb-2">
          {badge && <span className="ui-badge">{badge}</span>}
          {title && <span className="ui-label">{title}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

const ESTADOS_BRASIL = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const { login: authLogin, register: authRegister } = useAuth();
  const navigate = useNavigate();

  // Login
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Conta (signup)
  const [rUser, setRUser] = useState("");
  const [rPass, setRPass] = useState("");
  const [confirm, setConfirm] = useState("");

  // Perfil (completo)
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState("https://i.pravatar.cc/150");
  const [cargo, setCargo] = useState("");
  const [resumo, setResumo] = useState("");

  // Localizacao e area
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [area, setArea] = useState("");

  const [habilidadesTecnicas, setHabilidadesTecnicas] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);

  const [experiencias, setExperiencias] = useState([]);
  const [formacao, setFormacao] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [certificacoes, setCertificacoes] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [areasInteresse, setAreasInteresse] = useState([]);

  // Redes sociais (opcional)
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [instagram, setInstagram] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoginLoading(true);
      await authLogin(lUser, lPass);
      navigate("/perfis");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao entrar");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!rUser || !rPass) return alert("Informe usuario e senha.");
    if (rPass !== confirm) return alert("Senhas diferentes.");
    if (!nome || !cargo) return alert("Informe pelo menos Nome e Cargo.");
    if (!estado) return alert("Selecione um estado.");

    const localizacao =
      cidade && estado ? `${cidade} - ${estado}` : cidade || estado || "";

    const profile = {
      username: rUser,
      nome,
      foto,
      cargo,
      resumo,
      localizacao,
      estado,
      cidade,
      area,
      habilidadesTecnicas,
      softSkills,
      experiencias,
      formacao,
      projetos,
      certificacoes,
      idiomas,
      areasInteresse,
      redes: {
        linkedin,
        github,
        portfolio,
        instagram,
      },
    };

    try {
      setLoading(true);
      await authRegister(rUser, rPass);
      await authLogin(rUser, rPass);
      await createProfile(profile);
      alert("Conta e card criados com sucesso!");
      navigate("/perfis");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.error || err?.message || "Erro ao registrar"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fundo gradiente simples para nao ter problemas de encoding */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-sky-950" />

      <div className="relative z-10 grid place-items-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
          {/* Lado esquerdo com logo / texto de apoio */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="text-left max-w-md">
              <Brand size={64} />
              <h1 className="mt-6 text-3xl lg:text-4xl font-semibold text-white">
                Conecte talentos e crie seu card profissional.
              </h1>
              <p className="mt-4 text-sm text-slate-200">
                Use esta tela para entrar rapidamente ou criar sua conta com um
                card completo que sera exibido na Home junto com outros perfis.
              </p>
              <ul className="mt-4 space-y-1 text-sm text-slate-200">
                <li>- Aba "Ja tenho conta": login simples.</li>
                <li>- Aba "Criar conta + card": cadastro completo.</li>
                <li>- Depois, a SkillUp IA usa seu card para montar planos de estudo.</li>
              </ul>
            </div>
          </div>

          {/* Lado direito com abas login / cadastro */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur shadow-xl shadow-slate-950/40 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">
                  {tab === "login" ? "Entrar" : "Criar conta e card"}
                </h2>
                <p className="text-xs text-slate-400">
                  {tab === "login"
                    ? "Acesse sua conta com usuario e senha."
                    : "Crie sua conta e ja deixe o card pronto para aparecer na lista."}
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-full border border-slate-700 bg-slate-900 p-1 text-xs mb-4">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`px-3 py-1.5 rounded-full ${
                  tab === "login"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Ja tenho conta
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`px-3 py-1.5 rounded-full ${
                  tab === "signup"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Criar conta + card
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1">
              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="ui-label">Usuario</label>
                    <input
                      value={lUser}
                      onChange={(e) => setLUser(e.target.value)}
                      className="ui-input"
                      placeholder="seu_usuario"
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ui-label">Senha</label>
                    <input
                      type="password"
                      value={lPass}
                      onChange={(e) => setLPass(e.target.value)}
                      className="ui-input"
                      placeholder="********"
                      autoComplete="current-password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="ui-btn-primary w-full mt-2"
                  >
                    {loginLoading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <StepPanel badge="Passo 1" title="Conta de acesso">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="ui-label">Usuario *</label>
                        <input
                          required
                          value={rUser}
                          onChange={(e) => setRUser(e.target.value)}
                          className="ui-input mt-1"
                          placeholder="seu_usuario"
                          autoComplete="username"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Senha *</label>
                        <input
                          type="password"
                          required
                          value={rPass}
                          onChange={(e) => setRPass(e.target.value)}
                          className="ui-input mt-1"
                          placeholder="minimo 6 caracteres"
                          autoComplete="new-password"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Confirmar senha *</label>
                        <input
                          type="password"
                          required
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className="ui-input mt-1"
                          placeholder="repita a senha"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </StepPanel>

                  <StepPanel badge="Passo 2" title="Perfil basico">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="ui-label">Nome (card) *</label>
                        <input
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Cargo *</label>
                        <input
                          required
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="Ex.: Eng de Software"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Cidade</label>
                        <input
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="Ex.: Sao Paulo"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Estado *</label>
                        <select
                          required
                          value={estado}
                          onChange={(e) => setEstado(e.target.value)}
                          className="ui-input mt-1 text-slate-100"
                        >
                          <option value="">Selecione</option>
                          {ESTADOS_BRASIL.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="ui-label">Area</label>
                        <input
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="Ex.: Desenvolvimento, Dados, Design..."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="ui-label">Resumo</label>
                        <textarea
                          rows={3}
                          value={resumo}
                          onChange={(e) => setResumo(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="Conte rapidamente sua experiencia, foco e principais resultados."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="ui-label">URL da foto</label>
                        <input
                          value={foto}
                          onChange={(e) => setFoto(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="https://sua-foto.com/perfil.jpg"
                        />
                        <p className="ui-hint">
                          Use uma foto quadrada (1:1). Pode colar a URL do LinkedIn ou GitHub.
                        </p>
                      </div>
                    </div>
                  </StepPanel>

                  <StepPanel badge="Passo 3" title="Habilidades">
                    <Tags
                      label="Habilidades tecnicas"
                      items={habilidadesTecnicas}
                      setItems={setHabilidadesTecnicas}
                      placeholder="Ex.: React, Docker, SQL"
                    />
                    <Tags
                      label="Soft skills"
                      items={softSkills}
                      setItems={setSoftSkills}
                      placeholder="Ex.: Comunicacao, Lideranca"
                    />
                  </StepPanel>

                  <StepPanel badge="Passo 4" title="Experiencia e formacao">
                    <ObjList
                      label="Experiencias"
                      items={experiencias}
                      setItems={setExperiencias}
                      schema={{
                        empresa: "",
                        cargo: "",
                        inicio: "",
                        fim: "",
                        descricao: "",
                      }}
                      hint="Preencha empresa, cargo, periodo e uma breve descricao."
                    />
                    <ObjList
                      label="Formacao"
                      items={formacao}
                      setItems={setFormacao}
                      schema={{ curso: "", instituicao: "", ano: "" }}
                    />
                    <ObjList
                      label="Projetos"
                      items={projetos}
                      setItems={setProjetos}
                      schema={{ titulo: "", link: "", descricao: "" }}
                    />
                  </StepPanel>

                  <StepPanel badge="Passo 5" title="Extras do perfil">
                    <Tags
                      label="Certificacoes"
                      items={certificacoes}
                      setItems={setCertificacoes}
                      placeholder="Ex.: AZ-900, AWS CCP"
                    />
                    <ObjList
                      label="Idiomas"
                      items={idiomas}
                      setItems={setIdiomas}
                      schema={{ idioma: "", nivel: "" }}
                    />
                    <Tags
                      label="Areas de interesse"
                      items={areasInteresse}
                      setItems={setAreasInteresse}
                      placeholder="Ex.: Sustentabilidade, Esportes"
                    />
                  </StepPanel>

                  <StepPanel badge="Opcional" title="Redes e links">
                    <p className="ui-hint mb-2">
                      Preencha se quiser deixar seus contatos visiveis nos detalhes do perfil.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="ui-label">LinkedIn</label>
                        <input
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="URL do LinkedIn"
                        />
                      </div>
                      <div>
                        <label className="ui-label">GitHub</label>
                        <input
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="URL do GitHub"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Portfolio</label>
                        <input
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="Site / portfolio"
                        />
                      </div>
                      <div>
                        <label className="ui-label">Instagram</label>
                        <input
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="ui-input mt-1 text-slate-100 placeholder:text-slate-500"
                          placeholder="@seuusuario"
                        />
                      </div>
                    </div>
                  </StepPanel>

                  <button
                    type="submit"
                    disabled={loading}
                    className="ui-btn-primary mt-1"
                  >
                    {loading ? "Criando..." : "Criar conta e card"}
                  </button>
                  <p className="ui-hint">
                    Seu card sera adicionado automaticamente ao fim da lista.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

