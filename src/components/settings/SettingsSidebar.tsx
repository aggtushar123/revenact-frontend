import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  User,
  CreditCard,
  Sliders,
  Globe,
  Zap,
  Info,
  Monitor,
} from 'lucide-react';

interface SettingsNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { to: '/account-settings/account', label: 'Account', icon: User },
  { to: '/account-settings/billing', label: 'Plan & billing', icon: CreditCard },
  { to: '/account-settings/integrations', label: 'Integrations', icon: Sliders },
  { to: '/account-settings/personalization', label: 'Personalization', icon: Globe },
  { to: '/account-settings/skills', label: 'Skills & Tasks', icon: Zap },
  { to: '/account-settings/about', label: 'About', icon: Info },
];

export function SettingsSidebar() {
  return (
    <aside
      className="w-[215px] lg:w-[225px] shrink-0 bg-[var(--rv-sidebar-bg)] border-r border-[var(--rv-sidebar-border)] flex flex-col justify-between p-3 sm:p-3.5 select-none h-full transition-colors"
      aria-label="Settings navigation"
    >
      <div className="flex flex-col gap-4">
        <div className="px-2 pt-1">
          <h2 className="text-[13.5px] font-semibold text-[var(--rv-text)] tracking-tight">
            Settings
          </h2>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Settings tabs">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[12.5px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--rv-sidebar-active-bg)] text-[var(--rv-sidebar-active-text)] border border-[var(--rv-sidebar-active-border)] shadow-xs font-semibold'
                      : 'text-[var(--rv-sidebar-inactive-text)] hover:text-[var(--rv-text)] hover:bg-black/5 dark:hover:bg-white/[0.04] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-[15px] h-[15px] shrink-0 transition-colors ${
                        isActive ? 'text-[var(--rv-sidebar-active-text)]' : 'text-[var(--rv-sidebar-inactive-text)]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Desktop App Promo Card at bottom of sidebar (matching screenshot) */}
      <div className="pt-3 border-t border-[var(--rv-sidebar-border)]">
        <div className="bg-[var(--rv-card-bg)] rounded-xl p-2.5 border border-[var(--rv-card-border)] shadow-xs flex items-center gap-2.5 group hover:border-[var(--rv-card-border-hover)] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[var(--rv-pill-primary-bg)] border border-[var(--rv-card-border)] flex items-center justify-center text-[var(--rv-pill-primary-text)] shrink-0 shadow-xs">
            <Monitor className="w-4 h-4 text-[var(--rv-pill-primary-text)]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[12px] font-semibold text-[var(--rv-text)] truncate leading-tight">
              Revenact for desktop
            </h4>
            <p className="text-[10.5px] text-[var(--rv-text-muted)] truncate leading-tight mt-0.5">
              Get the macOS app
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
