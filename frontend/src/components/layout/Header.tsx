import { useState } from 'react'
import { Bell, Search, Moon, Sun, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setDark(d => !d)
  }

  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Title area */}
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-none">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search hint */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-accent transition-colors">
          <Search size={13} />
          <span>Search…</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-background border border-border text-[10px]">⌘K</kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Alerts */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Link>

        {/* User avatar */}
        <Link to="/settings" className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user ? getInitials(user.full_name) : '?'}
            </span>
          </div>
          <ChevronDown size={12} className="text-muted-foreground hidden md:block" />
        </Link>
      </div>
    </header>
  )
}
