import { Outlet } from 'react-router-dom';
import { DrillProvider } from './drill/DrillContext';
import { DrillPanel } from './drill/DrillPanel';

/** The dashboard's own scroll container and page padding.
 *
 *  `DashboardLayout`'s `<main>` is `overflow-hidden` (the Copilot, the
 *  scenario builder and Communications each manage their own scroll), so
 *  every page under it has to own its scroll. One element on the
 *  `dashboard` route does it for Overview and every area at once, rather
 *  than each wrapper remembering to. `min-h-0` lets this flex child shrink
 *  below its content so the overflow lands here, not on `<main>`.
 *
 *  The drill panel sits beside the scroll area from `lg`, so opening it
 *  never scrolls the page away. */
export function DashboardFrame() {
  return (
    <DrillProvider>
      <div className="flex-1 min-h-0 w-full flex gap-4 p-4">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
        <DrillPanel />
      </div>
    </DrillProvider>
  );
}
