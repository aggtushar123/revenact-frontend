import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchContactsForCustomer } from '../../../features/customers/customersSlice';
import { ContactsTab } from '../../shared/ContactsTab';

/** People: today's Contacts tab inside the new frame (spec §4, delivery 1).
 *  It reads the contacts when first opened, not when the page lands.
 *  Delivery 2 turns it into list items filtered by account. */
export function PeopleTab({ customerId }: { customerId: number }) {
  const dispatch = useAppDispatch();
  const { contacts, contactsLoading, contactsError } = useAppSelector((state) => state.customers);
  useEffect(() => {
    dispatch(fetchContactsForCustomer(customerId));
  }, [dispatch, customerId]);
  return <ContactsTab contacts={contacts} isLoading={contactsLoading} error={contactsError} customerId={customerId} embedded />;
}
