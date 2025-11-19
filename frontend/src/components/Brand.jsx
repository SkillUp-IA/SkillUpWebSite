export default function Brand({
  size = 40,
  stacked = false,
  showText = true,
  subtitle,
}) {
  const WrapperTag = "div";

  return (
    <WrapperTag
      className={
        stacked
          ? "flex flex-col items-center gap-2"
          : "flex items-center gap-2"
      }
    >
      <div
        className="
          rounded-2xl p-1
          bg-slate-900/90 shadow-sm shadow-sky-500/20
          dark:bg-slate-900/90
        "
      >
        <img
          src="/skillup-logo-branca.png"
          alt="SkillUp IA"
          width={size}
          height={size}
          draggable="false"
          className="select-none pointer-events-none rounded-xl"
        />
      </div>

      {showText && (
        <div
          className={
            stacked
              ? "flex flex-col items-center text-center"
              : "flex flex-col"
          }
        >
          <span className="font-semibold text-slate-900 dark:text-slate-50 text-lg sm:text-xl tracking-tight">
            <span className="text-sky-500 dark:text-sky-400">Skill</span>
            <span>Up</span>{" "}
            <span className="text-slate-500 dark:text-slate-300">IA</span>
          </span>

          {subtitle && (
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </WrapperTag>
  );
}
