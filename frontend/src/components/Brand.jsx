export default function Brand({ size = 40, stacked = false }) {
  return (
    <div className={stacked ? "flex flex-col items-center gap-3" : "flex items-center gap-3"}>
      {/* usar caminho da pasta public/ */}
      <img
        src="/skillup-logo.png"
        alt="SkillUp IA"
        width={size}
        height={size}
        className="select-none"
      />
      {!stacked && (
        <span className="font-semibold text-skill-primary text-xl tracking-tight">SkillUp IA</span>
      )}
    </div>
  );
}
