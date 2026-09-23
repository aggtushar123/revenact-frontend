import { Outlet } from 'react-router-dom';

/** The dashboard's own scroll container and page padding.
 *
 *  `DashboardLayout`'s `<main>` is `overflow-hidden` (the Copilot, the
 *  scenario builder and Communications each manage their own scroll), so
 *  every page under it has to own its scroll. One element on the
 *  `dashboard` route does it for Overview and every area at once, rather
 *  than each wrapper remembering to. `min-h-0` lets this flex child shrink
 *  below its content so the overflow lands here, not on `<main>`. */
export function DashboardFrame() {
  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto p-4">
      <Outlet />
    </div>
  );
}
