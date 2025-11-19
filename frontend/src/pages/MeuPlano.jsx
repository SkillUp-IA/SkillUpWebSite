import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { aiLearningPlan, aiMentor, aiQuizBank, fetchProfiles } from "../lib/api.js";

export default function MeuPlanoPage() {
  const { username } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [planProgress, setPlanProgress] = useState([]);
  const [quizState, setQuizState] = useState({
    loaded: false,
    loading: false,
    error: "",
    area: "",
    questionsByLevel: { iniciante: [], intermediario: [], avancado: [] },
    current: null,
    lastAnswerCorrect: null,
    answered: false,
    stats: { correct: 0, wrong: 0 },
  });
  const [mentorMessages, setMentorMessages] = useState([]);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);

  // carrega perfis
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await fetchProfiles({ pageSize: 200 });
        const list = Array.isArray(res) ? res : res.items ?? [];
        setProfiles(list);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar seus perfis.");
      }
    })();
  }, []);

  // escolhe perfil "atual" com base no username
  useEffect(() => {
    if (!profiles.length) return;
    let mine = profiles.filter((p) => p.username && p.username === username);
    if (!mine.length) mine = profiles;
    if (!mine.length) return;
    const chosen = mine[mine.length - 1]; // usa o mais recente
    setCurrentProfile(chosen);
  }, [profiles, username]);

  // progresso salvo localmente
  useEffect(() => {
    if (!currentProfile || typeof window === "undefined") return;
    const key = `skillup_plan_progress_${currentProfile.id}`;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      setPlanProgress(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPlanProgress([]);
    }
  }, [currentProfile]);

  const progressData = useMemo(() => {
    if (!plan || !Array.isArray(plan.trilha) || !plan.trilha.length) {
      return { done: 0, total: 0, percent: 0 };
    }
    const total = plan.trilha.length;
    const done = plan.trilha.filter((step) =>
      planProgress.includes(step.id || step.titulo)
    ).length;
    const percent = Math.round((done / total) * 100);
    return { done, total, percent };
  }, [plan, planProgress]);

  async function handleGeneratePlan() {
    if (!currentProfile) return;
    try {
      setLoading(true);
      setError("");
      const data = await aiLearningPlan(currentProfile);
      setPlan(data || null);
    } catch (e) {
      console.error(e);
      setError("Erro ao gerar plano de aprendizado.");
    } finally {
      setLoading(false);
    }
  }

  function toggleStep(stepId) {
    if (!currentProfile || !plan || typeof window === "undefined") return;
    const key = `skillup_plan_progress_${currentProfile.id}`;
    setPlanProgress((prev) => {
      const set = new Set(prev);
      if (set.has(stepId)) set.delete(stepId);
      else set.add(stepId);
      const arr = Array.from(set);
      localStorage.setItem(key, JSON.stringify(arr));
      return arr;
    });
  }

  async function handleStartQuiz() {
    if (!currentProfile) return;
    try {
      setQuizState((prev) => ({ ...prev, loading: true, error: "" }));
      const area = currentProfile.area || "Desenvolvimento";
      const data = await aiQuizBank(area);
      const all = Array.isArray(data.questoes) ? data.questoes : [];
      const byLevel = {
        iniciante: all.filter((q) => q.nivel === "iniciante"),
        intermediario: all.filter((q) => q.nivel === "intermediario"),
        avancado: all.filter((q) => q.nivel === "avancado"),
      };
      const first =
        byLevel.iniciante[0] || byLevel.intermediario[0] || byLevel.avancado[0] || null;
      setQuizState({
        loaded: true,
        loading: false,
        error: "",
        area: data.area || area,
        questionsByLevel: byLevel,
        current: first,
        lastAnswerCorrect: null,
        answered: false,
        stats: { correct: 0, wrong: 0 },
      });
    } catch (e) {
      console.error(e);
      setQuizState((prev) => ({
        ...prev,
        loading: false,
        error: "Não foi possível carregar o simulado agora.",
      }));
    }
  }

  function handleAnswerQuiz(choiceIndex) {
    setQuizState((prev) => {
      if (!prev.current || prev.answered) return prev;
      const isCorrect = choiceIndex === prev.current.corretaIndex;
      const stats = {
        correct: prev.stats.correct + (isCorrect ? 1 : 0),
        wrong: prev.stats.wrong + (!isCorrect ? 1 : 0),
      };
      return {
        ...prev,
        lastAnswerCorrect: isCorrect,
        answered: true,
        stats,
      };
    });
  }

  function pickNextQuestion(prevState) {
    const { current, questionsByLevel, lastAnswerCorrect } = prevState;
    if (!current) return null;
    const levelOrder = ["iniciante", "intermediario", "avancado"];
    let currentLevelIndex = levelOrder.indexOf(current.nivel);
    if (currentLevelIndex === -1) currentLevelIndex = 0;

    let targetLevelIndex = currentLevelIndex;
    if (lastAnswerCorrect) {
      // acerto -> tenta subir nível
      targetLevelIndex = Math.min(levelOrder.length - 1, currentLevelIndex + 1);
    } else {
      // erro -> pode descer nível
      targetLevelIndex = Math.max(0, currentLevelIndex - 1);
    }

    const candidateLevels =
      targetLevelIndex === currentLevelIndex
        ? [levelOrder[targetLevelIndex]]
        : [levelOrder[targetLevelIndex], levelOrder[currentLevelIndex]];

    for (const lvl of candidateLevels) {
      const list = questionsByLevel[lvl] || [];
      if (list.length) {
        const [next, ...rest] = list;
        return { next, level: lvl, remaining: rest };
      }
    }

    // se não tiver mais nada, retorna null
    return null;
  }

  function handleNextQuiz() {
    setQuizState((prev) => {
      if (!prev.current) return prev;
      const pick = pickNextQuestion(prev);
      if (!pick) {
        // sem perguntas restantes
        return {
          ...prev,
          current: null,
          answered: false,
          lastAnswerCorrect: null,
        };
      }
      const levelOrder = ["iniciante", "intermediario", "avancado"];
      const updatedByLevel = { ...prev.questionsByLevel };
      updatedByLevel[pick.level] = pick.remaining;
      return {
        ...prev,
        questionsByLevel: updatedByLevel,
        current: pick.next,
        answered: false,
        lastAnswerCorrect: null,
      };
    });
  }

  async function handleSendMentor() {
    const text = mentorInput.trim();
    if (!text || !currentProfile) return;
    const nextMessages = [
      ...mentorMessages,
      { from: "user", text },
    ];
    setMentorMessages(nextMessages);
    setMentorInput("");
    try {
      setMentorLoading(true);
      const data = await aiMentor({
        mensagem: text,
        perfil: currentProfile,
        plano: plan,
      });
      const resposta = data.resposta || "";
      setMentorMessages((prev) => [
        ...prev,
        { from: "mentor", text: resposta },
      ]);
    } catch (e) {
      console.error(e);
      setMentorMessages((prev) => [
        ...prev,
        {
          from: "mentor",
          text:
            "Tive um problema para responder agora. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setMentorLoading(false);
    }
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Meu Plano</h1>
          <p className="text-sm text-slate-300">
            Ainda não encontramos um card de perfil associado à sua conta.
          </p>
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm"
          >
            Criar meu primeiro card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">
              Meu Plano de Desenvolvimento
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Plano baseado no seu card mais recente.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => navigate("/perfis")}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800"
            >
              Voltar para os cards
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* Card do perfil atual */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
              Perfil atual
            </p>
            <h2 className="text-lg font-semibold truncate">
              {currentProfile.nome}
            </h2>
            <p className="text-sm text-slate-300 truncate">
              {currentProfile.cargo}
            </p>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {currentProfile.localizacao} · {currentProfile.area}
            </p>
          </div>
          <div className="sm:w-56">
            <p className="text-xs text-slate-400 mb-1">
              Progresso geral da trilha
            </p>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressData.percent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-300">
              {progressData.total
                ? `${progressData.done}/${progressData.total} etapas concluídas (${progressData.percent}%)`
                : "Nenhuma etapa definida ainda."}
            </p>
          </div>
        </section>

        {/* Plano de aprendizado */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold">
                Plano de aprendizado com IA
              </h2>
              <p className="text-xs text-slate-400">
                Gere ou atualize seu plano sempre que seu perfil mudar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={loading}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {loading ? "Gerando plano..." : "Gerar / atualizar plano"}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400">
              {error}
            </p>
          )}

          {plan && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
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
                <div className="space-y-3">
                  {plan.trilha.map((step, index) => {
                    const stepId = step.id || step.titulo || String(index);
                    const done = planProgress.includes(stepId);
                    return (
                      <div
                        key={stepId}
                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex gap-3"
                      >
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={done}
                            onChange={() => toggleStep(stepId)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {step.titulo}
                            </p>
                            {step.tipo && (
                              <span className="text-[11px] px-2 py-[1px] rounded-full bg-slate-800 text-slate-100">
                                {step.tipo}
                              </span>
                            )}
                          </div>
                          {step.foco && (
                            <p className="text-xs text-slate-300">
                              {step.foco}
                            </p>
                          )}
                          {step.duracaoHoras != null && (
                            <p className="text-[11px] text-slate-400">
                              ~ {step.duracaoHoras}h previstas
                            </p>
                          )}
                          {step.conteudo && (
                            <p className="text-xs text-slate-200 mt-1 whitespace-pre-line">
                              {step.conteudo}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {Array.isArray(plan.observacoes) && plan.observacoes.length > 0 && (
                <ul className="mt-1 text-[11px] text-slate-400 list-disc pl-4 space-y-0.5">
                  {plan.observacoes.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!plan && !loading && (
            <p className="text-xs text-slate-400">
              Clique em &quot;Gerar / atualizar plano&quot; para criar sua
              primeira trilha personalizada.
            </p>
          )}
        </section>

        {/* Simulado adaptativo simples */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold">
                Simulado adaptativo
              </h2>
              <p className="text-xs text-slate-400">
                Responda às questões para ajustar a dificuldade de acordo com o seu nível.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={quizState.loading}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {quizState.loading
                ? "Carregando simulado..."
                : quizState.loaded
                ? "Reiniciar simulado"
                : "Começar simulado"}
            </button>
          </div>

          {quizState.error && (
            <p className="text-xs text-red-400">{quizState.error}</p>
          )}

          {quizState.loaded && quizState.current && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-slate-400">
                Área: {quizState.area || currentProfile.area || "Desenvolvimento"} · Nível da questão:{" "}
                <span className="capitalize">{quizState.current.nivel}</span>
              </p>
              <p className="text-sm font-medium text-slate-50">
                {quizState.current.pergunta}
              </p>
              <div className="space-y-2 mt-2">
                {quizState.current.alternativas?.map((alt, idx) => {
                  const isCorrect = idx === quizState.current.corretaIndex;
                  const selected = quizState.answered && idx === quizState.current.corretaIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerQuiz(idx)}
                      disabled={quizState.answered}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm border transition ${
                        quizState.answered
                          ? isCorrect
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                            : "border-slate-700 bg-slate-800 text-slate-200 opacity-80"
                          : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100"
                      }`}
                    >
                      {alt}
                      {quizState.answered && isCorrect && (
                        <span className="ml-2 text-[11px] font-semibold">
                          (correta)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {quizState.answered && (
                <div className="mt-2 space-y-1">
                  <p
                    className={`text-xs ${
                      quizState.lastAnswerCorrect
                        ? "text-emerald-400"
                        : "text-amber-300"
                    }`}
                  >
                    {quizState.lastAnswerCorrect
                      ? "Boa! Você acertou esta questão."
                      : "Desta vez não deu, mas faz parte do processo de aprendizagem."}
                  </p>
                  {quizState.current.explicacao && (
                    <p className="text-xs text-slate-300">
                      Explicação: {quizState.current.explicacao}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleNextQuiz}
                    className="mt-1 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700"
                  >
                    Próxima questão
                  </button>
                </div>
              )}

              <p className="mt-2 text-[11px] text-slate-400">
                Desempenho até agora: {quizState.stats.correct} acertos ·{" "}
                {quizState.stats.wrong} erros.
              </p>
            </div>
          )}

          {quizState.loaded && !quizState.current && !quizState.loading && (
            <p className="text-xs text-slate-300 mt-2">
              Você respondeu todas as questões deste pequeno simulado. Use o resultado para decidir
              se revisa etapas mais básicas do plano ou avança para conteúdos mais desafiadores.
            </p>
          )}
        </section>

        {/* Mentoria com IA */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold">
                Mentoria com IA
              </h2>
              <p className="text-xs text-slate-400">
                Tire dúvidas sobre carreira, plano de estudos e próximos passos.
              </p>
            </div>
          </div>

          <div className="h-40 sm:h-52 rounded-xl border border-slate-800 bg-slate-950/70 p-3 overflow-y-auto space-y-2 text-xs">
            {mentorMessages.length === 0 && (
              <p className="text-slate-500">
                Comece enviando uma pergunta. Por exemplo: &quot;Por onde eu começo para migrar
                para a área de dados?&quot;
              </p>
            )}
            {mentorMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl ${
                    m.from === "user"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={mentorInput}
              onChange={(e) => setMentorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMentor();
                }
              }}
              placeholder="Escreva sua dúvida ou peça um resumo de um tema..."
              className="flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-950 border border-slate-800 outline-none"
            />
            <button
              type="button"
              onClick={handleSendMentor}
              disabled={mentorLoading}
              className="px-3 py-2 rounded-xl bg-sky-600 text-white text-xs sm:text-sm hover:bg-sky-500 disabled:opacity-60"
            >
              {mentorLoading ? "Enviando..." : "Perguntar"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
