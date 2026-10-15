import { NavLink, Outlet } from 'react-router-dom';
import { CubeIcon, HangerIcon, LayersIcon, ShareIcon } from './icons';
import { InstallButton, PwaUpdateToast } from './PwaPrompts';

const NAV = [
  { to: '/wardrobe', label: 'Wardrobe', Icon: HangerIcon },
  { to: '/outfits', label: 'Outfits', Icon: LayersIcon },
  { to: '/locker', label: 'Locker', Icon: CubeIcon },
  { to: '/share', label: 'Share', Icon: ShareIcon },
];

export function AppLayout() {
  return (
    <div className="snow-bg flex min-h-full flex-col sm:flex-row">
      <nav
        aria-label="Main"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-700 bg-ink-900/90 backdrop-blur sm:sticky sm:top-0 sm:h-screen sm:w-56 sm:border-t-0 sm:border-r"
      >
        <div className="hidden px-5 pt-6 pb-8 sm:block">
          <Brand />
        </div>
        <div className="absolute inset-x-3 bottom-6 hidden sm:block">
          <InstallButton className="w-full" />
        </div>
        <ul className="flex justify-around sm:flex-col sm:gap-1 sm:px-3">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1 sm:flex-none">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition sm:flex-row sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm ${
                    isActive ? 'text-ice sm:bg-ice/10' : 'text-ink-400 hover:text-white'
                  }`
                }
              >
                <Icon className="size-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex min-w-0 flex-1 flex-col pb-24 sm:pb-8">
        <Outlet />
      </main>
      <PwaUpdateToast />
    </div>
  );
}

export function Brand() {
  return (
    <span className="font-display text-xl font-black tracking-tight text-white">
      Shred<span className="text-ice">360</span>
    </span>
  );
}
