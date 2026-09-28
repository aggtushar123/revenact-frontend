import { createContext } from 'react';
import type { Account } from '../../../features/customers/customersSlice';

/** The organization's accounts, for the list items' account tags: a tag is
 *  named from here by `account_id`, so renaming an account from the chips
 *  shows on every item at once. Empty outside a list tab. */
export const AccountNames = createContext<Account[]>([]);
