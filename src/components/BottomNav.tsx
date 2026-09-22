import { BookOpen, Calendar, LayoutGrid } from 'lucide-react'

export type AppView = 'week' | 'month' | 'courses'

type BottomNavProps = {
  active: AppView
  onChange: (view: AppView) => void
}

const items: { id: AppView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'week', label: 'Settimana', icon: LayoutGrid },
  { id: 'month', label: 'Mese', icon: Calendar },
  { id: 'courses', label: 'Materie', icon: BookOpen },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 px-4 md:px-6"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      aria-label="Navigazione"
    >
      <div className="mx-auto max-w-lg flex bg-white/90 backdrop-blur-md border border-[rgba(26,42,92,0.1)] rounded-2xl shadow-[0_8px_28px_rgba(26,42,92,0.1)]">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3.5 transition-colors ${
                isActive ? 'text-navy' : 'text-muted hover:text-navy'
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 inset-y-2 rounded-xl bg-paper-2" />
              )}
              <Icon className="relative z-10 size-[18px]" strokeWidth={2.2} />
              <span className="relative z-10 text-[10px] font-semibold uppercase tracking-wider">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
