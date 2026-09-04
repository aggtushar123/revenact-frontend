import { useMemo, useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import { createCustomer } from '../../features/customers/customersSlice';
import { LIFECYCLE_LABELS } from '../../features/customers/formatters';
import { parseCsv } from './csvParser';
import { ApiError } from '../../lib/apiClient';
import type { CustomerWritePayload } from '../../features/customers/customersSlice';
import type { LifecycleCategory } from '../../components/organizations/tableData';

// Backs Settings > Entity Uploads (Navbar.tsx's own /settings/entity-uploads
// tab, unrouted until now) — CSV bulk-create for Organizations. No new
// backend endpoint: each mapped row becomes one real POST /customers/
// via the same createCustomer thunk the standalone "Add Organization"
// modal already uses (see OrganizationFormModal.tsx) — this is the
// same create path, just driven by a spreadsheet instead of a form,
// one row at a time so a bad row's failure doesn't lose the good ones.
//
// v1 is Organizations only (the tab's own most obvious target, and
// what OrganizationFormModal's own field set already maps cleanly to)
// — Accounts/Contacts import is a natural, structurally identical
// follow-up, not built here.
type FieldKey = 'name' | 'domain' | 'address' | 'lifecycle_stage' | 'joined_date' | 'renewal_date' | 'skip';

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: 'skip', label: '— Skip this column —' },
  { value: 'name', label: 'Name (required)' },
  { value: 'domain', label: 'Domain' },
  { value: 'address', label: 'Address' },
  { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
  { value: 'joined_date', label: 'Joined Date (YYYY-MM-DD)' },
  { value: 'renewal_date', label: 'Renewal Date (YYYY-MM-DD)' },
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LIFECYCLE_BY_LABEL: Record<string, LifecycleCategory> = Object.fromEntries(
  Object.entries(LIFECYCLE_LABELS).map(([value, label]) => [label.toLowerCase(), value as LifecycleCategory])
);

function guessField(header: string): FieldKey {
  const h = header.trim().toLowerCase();
  if (h === 'name' || h === 'organization' || h === 'organization name') return 'name';
  if (h === 'domain') return 'domain';
  if (h === 'address') return 'address';
  if (h.includes('lifecycle') || h.includes('stage')) return 'lifecycle_stage';
  if (h.includes('joined')) return 'joined_date';
  if (h.includes('renewal')) return 'renewal_date';
  return 'skip';
}

function coerceLifecycleStage(raw: string): LifecycleCategory | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (v in LIFECYCLE_LABELS) return v as LifecycleCategory;
  return LIFECYCLE_BY_LABEL[v];
}

interface RowResult {
  row: number;
  name: string;
  status: 'ok' | 'error';
  detail: string;
}

export function EntityUploadsPage() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<FieldKey[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const nameColumnIndex = mapping.indexOf('name');
  const canImport = nameColumnIndex !== -1 && dataRows.length > 0 && !isImporting;

  function reset() {
    setFileName(null);
    setParseError(null);
    setHeaders([]);
    setDataRows([]);
    setMapping([]);
    setResults(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setResults(null);
    setFileName(file.name);

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setParseError('That file has no rows.');
      return;
    }
    const [header, ...rest] = rows;
    if (rest.length === 0) {
      setParseError('That file only has a header row — nothing to import.');
      return;
    }
    setHeaders(header);
    setDataRows(rest);
    setMapping(header.map(guessField));
  }

  const previewRows = useMemo(() => dataRows.slice(0, 5), [dataRows]);

  function buildPayload(row: string[]): CustomerWritePayload & { name: string } {
    const payload: CustomerWritePayload & { name: string } = { name: '' };
    mapping.forEach((field, i) => {
      const raw = (row[i] ?? '').trim();
      if (!raw || field === 'skip') return;
      if (field === 'lifecycle_stage') {
        const stage = coerceLifecycleStage(raw);
        if (stage) payload.lifecycle_stage = stage;
      } else if (field === 'joined_date' || field === 'renewal_date') {
        if (DATE_RE.test(raw)) payload[field] = raw;
      } else {
        payload[field] = raw;
      }
    });
    return payload;
  }

  async function handleImport() {
    setIsImporting(true);
    setProgress(0);
    const outcomes: RowResult[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const payload = buildPayload(dataRows[i]);
      if (!payload.name) {
        outcomes.push({ row: i + 2, name: '(blank)', status: 'error', detail: 'No name in this row.' });
      } else {
        try {
          await dispatch(createCustomer(payload)).unwrap();
          outcomes.push({ row: i + 2, name: payload.name, status: 'ok', detail: 'Created.' });
        } catch (err) {
          const detail = err instanceof ApiError ? err.message : typeof err === 'string' ? err : 'Could not create.';
          outcomes.push({ row: i + 2, name: payload.name, status: 'error', detail });
        }
      }
      setProgress(i + 1);
    }

    setResults(outcomes);
    setIsImporting(false);
  }

  const successCount = results?.filter((r) => r.status === 'ok').length ?? 0;
  const failureCount = results ? results.length - successCount : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Entity Uploads</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Bulk-create Organizations from a CSV file — one real "Add Organization" per row.
        </p>
      </div>

      {!fileName && (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-line-strong rounded-xl py-16 cursor-pointer hover:border-accent/50 hover:bg-subtle/30 transition-colors">
          <UploadCloud className="w-8 h-8 text-ink-faint" />
          <span className="text-[13px] font-semibold text-ink">Click to choose a CSV file</span>
          <span className="text-[12px] text-ink-faint">First row must be column headers. A "Name" column is required.</span>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
        </label>
      )}

      {parseError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-danger-dim border border-danger/30 text-[12.5px] text-danger">
          <XCircle className="w-4 h-4 shrink-0" />
          {parseError}
          <button onClick={reset} className="ml-auto font-bold hover:underline">Try another file</button>
        </div>
      )}

      {fileName && !parseError && !results && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-muted">
              {fileName} — {dataRows.length} row{dataRows.length === 1 ? '' : 's'}
            </span>
            <button onClick={reset} className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-faint hover:text-ink-muted">
              <RotateCcw className="w-3.5 h-3.5" /> Choose a different file
            </button>
          </div>

          <div className="bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-line-subtle">
              <h2 className="text-[13px] font-bold text-ink">Map columns</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-subtle/40 border-b border-line-subtle">
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider whitespace-nowrap">
                        {h || `Column ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-line-subtle">
                    {headers.map((_, i) => (
                      <th key={i} className="px-4 py-2">
                        <select
                          value={mapping[i]}
                          onChange={(e) => setMapping((m) => m.map((v, idx) => (idx === i ? (e.target.value as FieldKey) : v)))}
                          className="w-full px-2 py-1.5 bg-surface border border-line rounded-md text-[12px] text-ink focus:outline-none focus:border-accent"
                        >
                          {FIELD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {previewRows.map((row, r) => (
                    <tr key={r}>
                      {headers.map((_, i) => (
                        <td key={i} className="px-4 py-2 text-[12.5px] text-ink-muted whitespace-nowrap max-w-[200px] truncate">
                          {row[i]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dataRows.length > previewRows.length && (
              <p className="px-5 py-2 text-[11.5px] text-ink-faint border-t border-line-subtle">
                +{dataRows.length - previewRows.length} more row{dataRows.length - previewRows.length === 1 ? '' : 's'} not shown.
              </p>
            )}
          </div>

          {nameColumnIndex === -1 && (
            <p className="text-[12.5px] text-warning">Map a column to "Name" to continue.</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={!canImport}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? `Importing ${progress}/${dataRows.length}…` : `Import ${dataRows.length} Organization${dataRows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-bold text-success">{successCount} created</span>
            {failureCount > 0 && <span className="text-[13px] font-bold text-danger">{failureCount} failed</span>}
            <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:text-accent-hover">
              <RotateCcw className="w-3.5 h-3.5" /> Upload another file
            </button>
          </div>
          <div className="bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle/40 border-b border-line-subtle sticky top-0">
                  <th className="px-4 py-2 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Row</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {results.map((r) => (
                  <tr key={r.row}>
                    <td className="px-4 py-2 text-[12.5px] text-ink-faint">{r.row}</td>
                    <td className="px-4 py-2 text-[12.5px] font-semibold text-ink">{r.name}</td>
                    <td className="px-4 py-2 text-[12.5px]">
                      <span className={`flex items-center gap-1.5 ${r.status === 'ok' ? 'text-success' : 'text-danger'}`}>
                        {r.status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {r.detail}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
