/** jsdom has no matchMedia. This answers `(min-width: Npx)` queries as a
 *  window `width` px wide would, so layout-by-breakpoint code can be tested. */
export function setViewport(width: number): void {
  window.matchMedia = ((query: string) => {
    const min = /\(min-width:\s*(\d+)px\)/.exec(query);
    return {
      matches: min ? width >= Number(min[1]) : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  }) as unknown as typeof window.matchMedia;
}

export function resetViewport(): void {
  // @ts-expect-error -- jsdom's own window has no matchMedia; put that back
  delete window.matchMedia;
}
