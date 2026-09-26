import { vi } from 'vitest';

type Entry = { isIntersecting: boolean; target: Element };
type Watcher = { callback: (entries: Entry[]) => void; targets: Set<Element> };

/** jsdom has no IntersectionObserver. This installs a fake one: `reveal`
 *  plays "this element scrolled into view" to every observer watching it,
 *  and `watching` says whether any observer still watches it. Unlike a
 *  browser, nothing fires on `observe`; a test calls `reveal` (inside
 *  `act`). `vi.unstubAllGlobals()` removes it. */
export function installIntersectionObserver() {
  const watchers = new Set<Watcher>();

  class FakeIntersectionObserver {
    private watcher: Watcher;

    constructor(callback: (entries: Entry[]) => void) {
      this.watcher = { callback, targets: new Set() };
      watchers.add(this.watcher);
    }

    observe(target: Element) {
      this.watcher.targets.add(target);
    }

    unobserve(target: Element) {
      this.watcher.targets.delete(target);
    }

    disconnect() {
      this.watcher.targets.clear();
      watchers.delete(this.watcher);
    }

    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

  return {
    reveal(target: Element) {
      for (const watcher of [...watchers]) {
        if (watcher.targets.has(target)) watcher.callback([{ isIntersecting: true, target }]);
      }
    },
    watching(target: Element) {
      return [...watchers].some((watcher) => watcher.targets.has(target));
    },
  };
}
