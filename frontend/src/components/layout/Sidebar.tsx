import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tag, PiggyBank, Target,
  BarChart3, Upload, Bot, Settings, ChevronLeft, ChevronRight,
  TrendingUp, Bell, LogOut, Sparkles,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions',   icon: ArrowLeftRight },
  { label: 'Accounts',     href: '/accounts',       icon: Wallet },
  { label: 'Categories',   href: '/categories',     icon: Tag },
  { label: 'Budgets',      href: '/budgets',        icon: PiggyBank },
  { label: 'Goals',        href: '/goals',          icon: Target },
  { label: 'Analytics',    href: '/analytics',      icon: BarChart3 },
  { label: 'Import',       href: '/import',         icon: Upload },
  { label: 'AI Assistant', href: '/assistant',      icon: Bot },
]

const BOTTOM_ITEMS = [
  { label: 'Alerts',       href: '/alerts',         icon: Bell },
  { label: 'Settings',     href: '/settings',       icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 h-16 border-b border-border',
        collapsed && 'justify-center px-0'
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0">
          <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-foreground">SmartSpend</span>
            <span className="text-sm font-bold text-primary"> AI</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} to={href}>
              {({ isActive }) => (
                <span className={cn('nav-item', isActive && 'active')}>
                  <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
                  {!collapsed && <span>{label}</span>}
                  {!collapsed && label === 'AI Assistant' && (
                    <Sparkles className="w-3 h-3 ml-auto text-primary/60" />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border space-y-0.5">
          {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} to={href}>
              {({ isActive }) => (
                <span className={cn('nav-item', isActive && 'active')}>
                  <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
                  {!collapsed && <span>{label}</span>}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User + collapse */}
      <div className="border-t border-border p-2">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">{getInitials(user.full_name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed && 'px-0'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
