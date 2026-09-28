/** Which organization or account a shared list slot holds, so a read for one
 *  never lands under another: `organization:<customer>` or
 *  `account:<customer>:<account>`. */
export function listScope(customerId: number, accountId?: number | null): string {
  return accountId == null ? `organization:${customerId}` : `account:${customerId}:${accountId}`;
}

/** The scope of a Files / CallSense parent. */
export function parentScope(parent: { entityType: 'organization' | 'account'; customerId: number; accountId?: number }): string {
  return listScope(parent.customerId, parent.entityType === 'account' ? parent.accountId : null);
}
