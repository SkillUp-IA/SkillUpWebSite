// src/components/Brand.jsx
export default function Brand({ size = 40, stacked = false }) {
  return (
    <div className={stacked ? "flex flex-col items-center gap-3" : "flex items-center gap-3"}>
      {/* usa arquivo em /public */}
      <img
        src="/public/skillup-logo.png"
        alt="SkillUp IA"
        width={size}
        height={size}
        draggable="false"
        className="select-none pointer-events-none"
      />
      {!stacked && (
        <span className="font-semibold text-skill-primary text-xl tracking-tight">
          SkillUp IA
        </span>
      )}
    </div>
  );
}
