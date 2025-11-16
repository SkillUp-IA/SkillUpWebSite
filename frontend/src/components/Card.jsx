// src/components/Card.jsx
export default function Card({ profile, onOpen }) {
  const {
    nome,
    cargo,
    localizacao,
    area,
    resumo,
    habilidadesTecnicas = [],
    foto,
  } = profile

  return (
    <button
      type="button"
      onClick={() => onOpen?.(profile)}
      className="
        group text-left w-full
        rounded-2xl border border-zinc-200/80 dark:border-zinc-800
        bg-white dark:bg-zinc-900/90
        p-4 sm:p-5

        transform-gpu will-change-transform
        transition-transform duration-200 ease-out
        hover:scale-110 hover:-translate-y-0.5 hover:z-10
        active:scale-[1.01]

        hover:shadow-xl hover:border-zinc-300/90 dark:hover:border-zinc-600
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
      "
    >
      <div className="flex items-center gap-4">
        <img
          src={foto}
          alt={nome}
          className="h-14 w-14 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
        />
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {nome}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{cargo}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {localizacao} • {area}
          </p>
        </div>
      </div>

      {!!resumo && (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 line-clamp-2">
          {resumo}
        </p>
      )}

      {!!habilidadesTecnicas.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {habilidadesTecnicas.slice(0, 3).map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="
                px-2 py-1 text-xs rounded-full
                bg-zinc-100 text-zinc-700
                dark:bg-zinc-800 dark:text-zinc-200
              "
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
