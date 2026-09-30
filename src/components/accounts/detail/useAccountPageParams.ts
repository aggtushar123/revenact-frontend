import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  parseAccountPageParams,
  toAccountPageSearch,
  withAccountPagePatch,
  type AccountPageParams,
} from '../../../features/accounts/accountPageParams';

/** The account page's URL state, as useDetailParams is the organization
 *  page's: `update` merges a patch into what the URL holds now and pushes a
 *  history entry unless `replace`. */
export function useAccountPageParams() {
  const [search, setSearch] = useSearchParams();
  const key = search.toString();
  const params = useMemo(() => parseAccountPageParams(new URLSearchParams(key)), [key]);
  const update = useCallback(
    (patch: Partial<AccountPageParams>, options: { replace?: boolean } = {}) => {
      setSearch((prev) => toAccountPageSearch(withAccountPagePatch(parseAccountPageParams(prev), patch)), {
        replace: options.replace ?? false,
      });
    },
    [setSearch],
  );
  return { params, update };
}
