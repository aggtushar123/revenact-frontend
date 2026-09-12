import { useEffect, useState, type FormEvent } from 'react';
import { ShieldAlert, Plus, Pencil, Trash2, Check, X, Archive, ArchiveRestore } from 'lucide-react';
import { useCapability } from '../../hooks';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from './productsApi';
import type { Product } from './productsApi';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { ApiError } from '../../lib/apiClient';

/**
 * Settings > Products: what this organisation sells.
 *
 * The one list every product picker and the Product Usage dashboard read
 * from. It replaced a free-text field, and the shape of this page follows
 * from the two things a list can do that a text box could not:
 *
 * - **Rename fixes the name everywhere at once.** Customers point at the
 *   row, so a typo is one edit here rather than one per customer.
 * - **Retire, don't delete, once anyone is on it.** Retiring takes a product
 *   out of the pickers and leaves every figure ever reported against it
 *   intact. Delete is offered only for a product with no customers — the
 *   backend refuses otherwise, and a button that will be refused is worse
 *   than no button.
 *
 * Everyone can see the list (the pickers need it); adding, renaming and
 * retiring need `manage_org_settings`. A CSM able to add "Prodcut A" from a
 * form would be the free-text problem coming back through a different door.
 */
export function ProductsPage() {
  const canManage = useCapability('manage_org_settings');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setProducts(await fetchProducts());
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load products.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Active first, retired after, each alphabetical — the API is alphabetical
  // only, and a retired product between two live ones reads as a mistake.
  const ordered = [...products].sort(
    (a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name)
  );
  const retiredCount = products.filter((p) => !p.is_active).length;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddError(null);
    setIsAdding(true);
    try {
      const created = await createProduct({ name: newName.trim() });
      setProducts((current) => [...current, created]);
      setNewName('');
      setShowAdd(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Could not add that product.');
    } finally {
      setIsAdding(false);
    }
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setEditName(product.name);
    setRowError(null);
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    setRowError(null);
    try {
      const updated = await updateProduct(id, { name: editName.trim() });
      setProducts((current) => current.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (err) {
      setRowError({
        id,
        message: err instanceof ApiError ? err.message : 'Could not rename that product.',
      });
    }
  }

  async function setActive(product: Product, isActive: boolean) {
    setRowError(null);
    try {
      const updated = await updateProduct(product.id, { is_active: isActive });
      setProducts((current) => current.map((p) => (p.id === product.id ? updated : p)));
    } catch (err) {
      setRowError({
        id: product.id,
        message:
          err instanceof ApiError
            ? err.message
            : `Could not ${isActive ? 'bring back' : 'retire'} that product.`,
      });
    }
  }

  const inputClass =
    'px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent';

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6 max-w-2xl">
      <div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Products</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          What this organisation sells — the list every product picker and the Product Usage
          dashboard read from.
        </p>
      </div>

      {!canManage && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          You can see the list but not change it — adding, renaming and retiring products needs
          organisation settings access.
        </div>
      )}

      <div className="flex flex-col gap-3 p-5 bg-surface border border-line rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[14px] font-bold text-ink">Catalogue</h2>
            <p className="text-[12px] text-ink-faint mt-0.5">
              Names are unique, ignoring case. Renaming a product renames it on every customer at
              once.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add product
            </button>
          )}
        </div>

        {showAdd && canManage && (
          <form onSubmit={handleAdd} className="flex items-end gap-2 p-3 bg-subtle/40 rounded-lg">
            <div className="flex flex-col gap-1 flex-1">
              <label
                htmlFor="new-product-name"
                className="text-[11px] font-bold text-ink-faint uppercase tracking-wide"
              >
                Name
              </label>
              <input
                id="new-product-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Integrations Module"
                autoFocus
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={!newName.trim() || isAdding}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setAddError(null);
                setNewName('');
              }}
              className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </form>
        )}
        {addError && <p className="text-[12.5px] text-danger">{addError}</p>}

        {isLoading ? (
          <p className="text-[12.5px] text-ink-faint py-4 text-center">Loading…</p>
        ) : loadError ? (
          <p className="text-[12.5px] text-danger py-4 text-center" role="alert">
            {loadError}
          </p>
        ) : products.length === 0 ? (
          <p className="text-[12.5px] text-ink-faint py-4 text-center">
            No products yet. Until one is added, no customer can be recorded on a product and
            the Product Usage dashboard has nothing to compare.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ordered.map((product) => (
              <li
                key={product.id}
                className={`flex flex-col gap-1 px-3 py-2 rounded-lg text-[13px] ${
                  product.is_active ? 'bg-subtle/30' : 'bg-subtle/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {editingId === product.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(product.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        aria-label={`New name for ${product.name}`}
                        autoFocus
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        onClick={() => saveEdit(product.id)}
                        className="p-1.5 hover:bg-subtle rounded-md text-success"
                        aria-label={`Save name for ${product.name}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 hover:bg-subtle rounded-md text-ink-faint"
                        aria-label="Cancel renaming"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-medium truncate ${
                            product.is_active ? 'text-ink' : 'text-ink-faint line-through'
                          }`}
                        >
                          {product.name}
                        </span>
                        {!product.is_active && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint bg-subtle px-1.5 py-0.5 rounded">
                            Retired
                          </span>
                        )}
                        <span className="text-[11.5px] text-ink-muted tabular-nums shrink-0">
                          {product.customers === 0
                            ? 'nobody on it'
                            : `${product.customers} ${product.customers === 1 ? 'customer' : 'customers'}`}
                        </span>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEditing(product)}
                            className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-ink"
                            aria-label={`Rename ${product.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {product.is_active ? (
                            <button
                              onClick={() => setActive(product, false)}
                              className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-warning"
                              aria-label={`Retire ${product.name}`}
                              title="Take it out of the pickers; customers already on it keep it"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setActive(product, true)}
                              className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-success"
                              aria-label={`Bring back ${product.name}`}
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Delete only when nobody is on it. The backend
                              refuses otherwise, and a button that will be
                              refused is worse than no button — retire is the
                              action people actually want then. */}
                          {product.customers === 0 && (
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-danger"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {rowError?.id === product.id && (
                  <p className="text-[12px] text-danger">{rowError.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {retiredCount > 0 && (
          <p className="text-[11px] text-ink-faint">
            Retired products stay on the customers already recorded against them and on the
            Product Usage dashboard; they are only hidden from the pickers.
          </p>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          message="Nobody is recorded on it, so nothing else changes. If it was ever sold, retire it instead — deleting is for a product added by mistake."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            try {
              await deleteProduct(deleteTarget.id);
            } catch (err) {
              // ConfirmDialog prints a thrown string; an ApiError's message
              // is the backend saying who is still on it.
              throw err instanceof ApiError ? err.message : 'Could not delete that product.';
            }
            setProducts((current) => current.filter((p) => p.id !== deleteTarget.id));
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
