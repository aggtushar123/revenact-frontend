import { createContext, useContext, type ReactNode } from 'react';

/** Set inside a frame an Ask layout draws, so the page's own frame inside
 *  it renders just its content rather than a second frame. */
const InFrame = createContext(false);

/** The Contacts frame, class for class the Organizations one (px-4 pb-4,
 *  gap-3, no top padding under the transparent top bar), with a content
 *  column and a slot for the Ask rail beside it. Delivery 2 (spec
 *  2026-09-28 §4) draws it once in a ContactsAskLayout with the rail in the
 *  slot, and this page's own frame then passes its content straight
 *  through; on its own it draws the frame with no rail. */
export function ContactsFrame({ rail = null, children }: { rail?: ReactNode; children: ReactNode }) {
  const inFrame = useContext(InFrame);
  if (inFrame) return <>{children}</>;
  return (
    <InFrame.Provider value={true}>
      <div data-frame="contacts" className="relative flex-1 min-h-0 w-full flex gap-3 px-4 pb-4">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto flex flex-col">{children}</div>
        {rail}
      </div>
    </InFrame.Provider>
  );
}
