import { useEffect, useRef, useState } from 'react';

/** A callback ref for the element at the end of a paged list. `onEnd` runs
 *  whenever that element scrolls into view (200px early) while `active`
 *  (there is a next page and none is loading). Turning `active` off and on
 *  again (a page landed) re-observes, and a browser observer fires at once
 *  if the end is still in view, so a short column keeps filling. Without
 *  IntersectionObserver (jsdom, very old browsers) it does nothing and the
 *  visible "Show more" button does the job. */
export function useEndSentinel(onEnd: () => void, active: boolean): (element: Element | null) => void {
  const [element, setElement] = useState<Element | null>(null);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!active || !element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onEndRef.current();
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, element]);

  return setElement;
}
