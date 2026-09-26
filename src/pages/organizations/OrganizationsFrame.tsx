import type { ReactNode } from 'react';

/** The Organizations list's and board's frame: DashboardFrame's body, class for class
 *  (px-4 pb-4, gap-3, no top padding because the transparent top bar above
 *  gives it), with a content column that owns its scroll (a flex column, so
 *  the Board can fill its height; the List just stacks) and a slot for the
 *  Ask rail beside it. The List and the Board pass `AskRail`, which also
 *  portals the pill into the Navbar's actions slot; hidden, or outside
 *  OrganizationsAskLayout, it renders nothing and the content takes the
 *  full width. */
export function OrganizationsFrame({ rail = null, children }: { rail?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex-1 min-h-0 w-full flex gap-3 px-4 pb-4">
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto flex flex-col">{children}</div>
      {rail}
    </div>
  );
}
