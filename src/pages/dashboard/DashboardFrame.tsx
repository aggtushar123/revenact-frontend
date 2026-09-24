import { Outlet } from 'react-router-dom';
import { DrillProvider } from './drill/DrillContext';
import { DrillPanel } from './drill/DrillPanel';
import { FilterNamesProvider } from './ask/FilterNamesProvider';
import { AskProvider } from './ask/AskProvider';
import { AskRail } from './ask/AskRail';

/** The dashboard's own scroll container and page padding, with the Ask
 *  rail beside it.
 *
 *  `DashboardLayout`'s `<main>` is `overflow-hidden`, so every page under it
 *  owns its scroll; one element here does it for Overview and every area.
 *  `min-h-0` lets this flex child shrink so the overflow lands here.
 *
 *  The Ask rail (and its conversation) lives above the areas, so it survives
 *  tab and filter changes. The drill panel opens over the rail from `lg`
 *  (absolute, right edge), so opening a drill never narrows the figures. */
export function DashboardFrame() {
  return (
    <FilterNamesProvider>
      <AskProvider>
        <DrillProvider>
          <div className="relative flex-1 min-h-0 w-full flex flex-col sm:flex-row gap-4 p-4">
            <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
              <Outlet />
            </div>
            <AskRail />
            <DrillPanel />
          </div>
        </DrillProvider>
      </AskProvider>
    </FilterNamesProvider>
  );
}
