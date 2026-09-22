type HeaderProps = {
  title?: string
}

export function Header({ title = 'Orario' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-[clamp(1.25rem,4vw,2rem)] py-3.5 backdrop-blur-md bg-[rgba(244,248,255,0.82)] border-b border-[rgba(26,42,92,0.08)]">
      <a
        href="/"
        className="inline-flex items-center gap-2.5 font-display font-extrabold text-[1.15rem] tracking-[-0.03em]"
        aria-label="UniOrario home"
      >
        <img
          src="/uniorario.png"
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-[10px] shadow-[0_2px_8px_rgba(47,123,255,0.25)]"
        />
        <span>
          <span className="text-navy">Uni</span>
          <span className="text-royal">Orario</span>
        </span>
      </a>
      <p className="text-sm font-medium text-muted truncate">{title}</p>
    </header>
  )
}
