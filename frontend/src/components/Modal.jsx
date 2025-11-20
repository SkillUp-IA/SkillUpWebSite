import { useEffect, useState } from "react";
import anime from "animejs";
import { aiLearningPlan, recommendProfile, sendMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const RECO_STORAGE_KEY = "skillup_recomendados";

export default function Modal({ open, onClose, data }) {
  if (!open || !data) return null;

  const { username } = useAuth();
  const [msg, setMsg] = useState("Curti seu perfil! Vamos conectar?");
  const [sending, setSending] = useState(false);          // recomendar
  const [sendingMessage, setSendingMessage] = useState(false); // enviar mensagem
  const [isRecommended, setIsRecommended] = useState(false);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planProgress, setPlanProgress] = useState([]);
  const [expandedStepId, setExpandedStepId] = useState(null);

  const {
    id,
    nome = "Nome não informado",
    cargo = "Cargo não informado",
    localizacao = "Localização não informada",
    resumo = "",
    foto,
    habilidadesTecnicas = [],
    softSkills = [],
    experiencias = [],
  } = data || {};

  // Marca se o perfil já foi recomendado localmente
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECO_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      setIsRecommended(list.includes(id));
    } catch (e) {
      console.error("Erro ao ler recomendações locais", e);
      setIsRecommended(false);
    }
  }, [id]);

  // Progresso da trilha de aprendizado por perfil
  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`skillup_plan_progress_${id}`);
      const parsed = raw ? JSON.parse(raw) : [];
      setPlanProgress(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPlanProgress([]);
    }
    setPlan(null);
    setLoadingPlan(false);
  }, [id]);

  function salvarRecomendacaoLocal(profileId) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECO_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(prev) ? prev : [];
      if (!list.includes(profileId)) {
        list.push(profileId);
        localStorage.setItem(RECO_STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error("Erro ao salvar recomendação local", e);
    }
  }

  function removerRecomendacaoLocal(profileId) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECO_STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(prev)
        ? prev.filter((x) => x !== profileId)
        : [];
      localStorage.setItem(RECO_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao remover recomendação local", e);
    }
  }

  async function handleRecommend() {
    try {
      setSending(true);

      await recommendProfile({
        toId: id,
        message: msg,
        from: username || "guest",
      });

      salvarRecomendacaoLocal(id);
      setIsRecommended(true);

      anime({
        targets: "#rec-ok",
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 400,
        easing: "easeOutQuad",
      });

      alert("Recomendação enviada e perfil salvo nas suas sugestões!");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Erro ao recomendar profissional.");
    } finally {
      setSending(false);
    }
  }

  function handleUnrecommend() {
    try {
      removerRecomendacaoLocal(id);
      setIsRecommended(false);
      alert("Recomendação removida das suas sugestões.");
    } catch (e) {
      console.error(e);
      alert("Erro ao remover recomendação.");
    }
  }

  async function handleGeneratePlan() {
    try {
      setLoadingPlan(true);
      const res = await aiLearningPlan(data);
      setPlan(res || null);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar plano de aprendizado.");
    } finally {
      setLoadingPlan(false);
    }
  }

  function toggleStep(stepId) {
    if (!plan || !stepId || typeof window === "undefined") return;
    setPlanProgress((prev) => {
      const set = new Set(prev);
      if (set.has(stepId)) set.delete(stepId);
      else set.add(stepId);
      const arr = Array.from(set);
      localStorage.setItem(`skillup_plan_progress_${id}`, JSON.stringify(arr));
      return arr;
    });
  }

  function toggleStepDetails(stepId) {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  }

  // Envio de mensagem que salva em data/messages.json
  async function handleSendMessage() {
    const text = msg.trim();
    if (!text) {
      return alert("Digite uma mensagem antes de enviar.");
    }

    try {
      setSendingMessage(true);
      await sendMessage({
        toId: id,
        text,
        fromName: username || "guest",
        fromContact: null, // se quiser depois pode enviar e-mail / linkedin aqui
      });
      alert("Mensagem enviada com sucesso!");
      // se quiser limpar o campo depois:
      // setMsg("");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-lg sm:max-w-2xl
          max-h-[calc(100vh-40px)]
          overflow-y-auto
          rounded-2xl
          bg-white dark:bg-zinc-900
          border border-zinc-200/80 dark:border-zinc-700/80
          p-4 sm:p-6 shadow-2xl
          "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          {foto && (
            <img
              src={foto}
              alt={nome}
              className="h-16 w-16 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{nome}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 truncate">
              {cargo} — {localizacao}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              text-sm px-3 py-1 rounded-lg
              bg-zinc-100 text-zinc-700 border border-zinc-200
              hover:bg-zinc-200
              dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700
              dark:hover:bg-zinc-700
            "
          >
            Fechar
          </button>
        </div>

        {/* Conteúdo */}
        <div className="mt-4 space-y-4 text-sm">
          {resumo && (
            <section>
              <h3 className="font-medium mb-1">Resumo</h3>
              <p className="text-zinc-700 dark:text-zinc-200">{resumo}</p>
            </section>
          )}

          {!!habilidadesTecnicas.length && (
            <section>
              <h3 className="font-medium mb-1">Habilidades técnicas</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {habilidadesTecnicas.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {!!softSkills.length && (
            <section>
              <h3 className="font-medium mb-1">Soft skills</h3>
              <p className="text-zinc-700 dark:text-zinc-200">
                {softSkills.join(" · ")}
              </p>
            </section>
          )}

          {!!experiencias.length && (
            <section>
              <h3 className="font-medium mb-1">Experiências</h3>
              <ul className="list-disc pl-5 space-y-1">
                {experiencias.map((e, i) => (
                  <li key={i}>
                    {e.empresa} — {e.cargo} ({e.inicio} → {e.fim})
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Plano de aprendizado / reskilling */}
          <section className="mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="font-medium">Plano de desenvolvimento com IA</h3>
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={loadingPlan}
                className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {loadingPlan ? "Gerando plano..." : "Gerar / atualizar plano"}
              </button>
            </div>

            {plan && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Objetivo:{" "}
                  <span className="font-medium">{plan.objetivo}</span> · Área
                  alvo:{" "}
                  <span className="font-medium">{plan.areaAlvo}</span> · Nível
                  atual:{" "}
                  <span className="font-medium capitalize">
                    {plan.nivelAtual}
                  </span>
                </p>

                {Array.isArray(plan.trilha) && plan.trilha.length > 0 && (
                  <div className="space-y-2 mt-1">
                    {plan.trilha.map((step) => {
                      const stepId = step.id || step.titulo;
                      const done = planProgress.includes(stepId);
                      return (
                        <label
                          key={stepId}
                          className="flex items-start gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={done}
                            onChange={() => toggleStep(stepId)}
                          />
                          <div>
                            <div className="text-xs font-semibold">
                              {step.titulo}{" "}
                              {step.tipo && (
                                <span className="ml-1 text-[11px] px-1.5 py-[1px] rounded-full bg-zinc-800 text-zinc-100">
                                  {step.tipo}
                                </span>
                              )}
                            </div>
                            {step.foco && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                                {step.foco}
                              </p>
                            )}
                            {step.duracaoHoras != null && (
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                ~ {step.duracaoHoras}h previstas
                              </p>
                            )}
                            {step.conteudo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleStepDetails(stepId);
                                }}
                                className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {expandedStepId === stepId
                                  ? "Esconder conteúdo"
                                  : "Ver conteúdo"}
                              </button>
                            )}
                            {expandedStepId === stepId && step.conteudo && (
                              <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-200 whitespace-pre-line">
                                {step.conteudo}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}

                    <p className="text-[11px] text-zinc-500">
                      Progresso:{" "}
                      {plan.trilha.length
                        ? `${planProgress.length}/${plan.trilha.length} etapas concluídas`
                        : "nenhuma etapa definida"}
                    </p>
                  </div>
                )}

                {Array.isArray(plan.observacoes) &&
                  plan.observacoes.length > 0 && (
                    <ul className="mt-1 text-[11px] text-zinc-500 list-disc pl-4 space-y-0.5">
                      {plan.observacoes.map((obs, i) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </section>
        </div>

        {/* Ações */}
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Mensagem de recomendação / contato..."
            className="
              px-3 py-2 rounded-xl text-sm outline-none
              bg-zinc-100 dark:bg-zinc-800
            "
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sendingMessage}
            className="
              rounded-lg px-4 py-2
              bg-zinc-800 text-white
              hover:bg-zinc-700
              disabled:opacity-60
            "
          >
            {sendingMessage ? "Enviando..." : "Enviar mensagem"}
          </button>

          <button
            type="button"
            onClick={handleRecommend}
            disabled={sending}
            className="
              rounded-lg px-4 py-2
              bg-blue-600 text-white
              hover:bg-blue-500
              disabled:opacity-60
            "
          >
            {sending ? "Enviando..." : "Recomendar profissional"}
          </button>
        </div>

        {isRecommended && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleUnrecommend}
              className="text-xs text-red-600 hover:underline"
            >
              Remover recomendação
            </button>
          </div>
        )}

        <div id="rec-ok" className="opacity-0 mt-2 text-xs text-emerald-600">
          ok
        </div>
      </div>
    </div>
  );
}
