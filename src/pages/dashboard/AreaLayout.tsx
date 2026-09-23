import { Outlet, useOutletContext } from 'react-router-dom';
import { AREAS } from './areas';
import type { AreaKey, SubView } from './areas';

/** Hands the area's sub-view list to whichever container is mounted, so each
 *  container's toolbar can render the switch without knowing its area. */
export function AreaLayout({ area }: { area: AreaKey }) {
  const subViews = AREAS.find((a) => a.key === area)!.views;
  return (
    <div className="h-full w-full">
      <Outlet context={{ subViews }} />
    </div>
  );
}

export function useSubViews(): SubView[] {
  return useOutletContext<{ subViews?: SubView[] } | undefined>()?.subViews ?? [];
}
