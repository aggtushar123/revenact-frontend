import { createContext, useContext, type ReactNode } from 'react';

/** Set inside the frame OrganizationsAskLayout draws, so a page's own frame
 *  inside it renders just its content rather than a second frame. */
const InFrame = createContext(false);

/** The Organizations list's and board's frame: DashboardFrame's body, class for class
 *  (px-4 pb-4, gap-3, no top padding because the transparent top bar above
 *  gives it), with a content column that owns its scroll (a flex column, so
 *  the Board can fill its height; the List just stacks) and a slot for the
 *  Ask rail beside it.
 *
 *  OrganizationsAskLayout draws the frame once, with `AskRail` in the slot,
 *  above both views, as DashboardFrame does: the rail (and the pill it
 *  portals into the Navbar) is one element that survives the List/Board
 *  swap, so a conversation reopened on the other view never lands in a rail
 *  that is about to unmount. The List and the Board still wrap themselves
 *  in this frame, which inside the layout passes their content straight
 *  through, and on its own (a page rendered alone) draws the frame without
 *  a rail, the content taking the full width. */
export function OrganizationsFrame({ rail = null, children }: { rail?: ReactNode; children: ReactNode }) {
  const inFrame = useContext(InFrame);
  if (inFrame) return <>{children}</>;
  return (
    <InFrame.Provider value={true}>
      <div className="relative flex-1 min-h-0 w-full flex gap-3 px-4 pb-4">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto flex flex-col">{children}</div>
        {rail}
      </div>
    </InFrame.Provider>
  );
}
