import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  parseDetailParams,
  toDetailSearch,
  withPatch,
  type DetailParams,
} from '../../../features/organizations/detailParams';

/** The organization page's URL state. `update` merges a patch into what the
 *  URL holds now and pushes a history entry unless `replace`. Its identity
 *  changes whenever the URL does (react-router's `setSearchParams` does), so
 *  a caller that must not re-run on it reads it through a ref. */
export function useDetailParams() {
  const [search, setSearch] = useSearchParams();
  const key = search.toString();
  const params = useMemo(() => parseDetailParams(new URLSearchParams(key)), [key]);
  const update = useCallback(
    (patch: Partial<DetailParams>, options: { replace?: boolean } = {}) => {
      setSearch((prev) => toDetailSearch(withPatch(parseDetailParams(prev), patch)), { replace: options.replace ?? false });
    },
    [setSearch],
  );
  return { params, update };
}
