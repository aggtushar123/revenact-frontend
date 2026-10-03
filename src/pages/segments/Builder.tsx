import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import { useMembers } from '../../features/knowledge/useMembers';
import { rulesFromList, type ListRules } from '../../features/segments/fromListFilters';
import { firstIncomplete, fromRules, toRules, type DraftRules } from '../../features/segments/ruleDraft';
import { createSegment, duplicateSegment, fetchRecordNames, updateSegment } from '../../features/segments/segmentApi';
import { formErrors, type FormErrors } from '../../features/segments/segmentErrors';
import { fieldsFor, KIND_LABEL } from '../../features/segments/segmentFields';
import {
  NO_LABELS,
  type PersonRef,
  type PreviewRequest,
  type RuleLabels,
  type Segment,
  type SegmentKind,
  type SegmentWrite,
  type Sharing,
} from '../../features/segments/segmentTypes';
import { Radio } from '../../components/organizations/portfolio/filterParts';
import { EmptyState } from '../../components/organizations/portfolio/PortfolioSections';
import { FOCUS, MONO, PRIMARY, QUIET } from '../../components/organizations/portfolio/styles';
import { errorMessage } from '../../components/organizations/portfolio/usePagedRead';
import { PreviewPanel } from '../../components/segments/PreviewPanel';
import { RuleEditor } from '../../components/segments/RuleEditor';
import { SegmentFailed, SegmentLoading, SegmentMissing } from '../../components/segments/SegmentStates';
import { SharingFields } from '../../components/segments/SharingFields';
import { useAttributes, useProducts } from '../../components/segments/useBuilderOptions';
import { usePreview } from '../../components/segments/usePreview';
import { useSegment } from '../../components/segments/useSegment';
import type { ValueOptions } from '../../components/segments/ValueInput';
import { OrganizationsFrame } from '../organizations/OrganizationsFrame';

const KINDS: SegmentKind[] = ['customer', 'account', 'contact'];
const INPUT = `min-h-11 rounded-lg border bg-surface px-2 text-[13px] text-ink hover:border-line-strong sm:min-h-9 ${FOCUS}`;
const NO_IDS: ListRules['ids'] = { customer: [], account: [] };

interface Initial {
  segment: Segment | null;
  kind: SegmentKind;
  draft: DraftRules;
  /** What a list's Save as segment could not carry over. */
  notes: string[];
  labels: RuleLabels;
  /** Organisation and account ids to name (Save as segment). */
  nameIds: ListRules['ids'];
}

/** /segments/new: `?kind=` and, from a list's Save as segment, that list's
 *  own filters (plan Decision 5). */
function fromList(search: URLSearchParams): Initial {
  const raw = search.get('kind');
  const kind: SegmentKind = raw === 'account' || raw === 'contact' ? raw : 'customer';
  const list = raw ? rulesFromList(kind, search) : null;
  return { segment: null, kind, draft: fromRules(list?.rules), notes: list?.notes ?? [], labels: NO_LABELS, nameIds: list?.ids ?? NO_IDS };
}

type WriteBody = Omit<SegmentWrite, 'kind'>;

const sameIds = (a: number[], b: number[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** The PATCH body (ruling G14): only the fields that differ from the segment
 *  as loaded. A rename never resends `rules`, because a rule naming a record
 *  the owner can no longer open reads `null` and would be saved as `null`.
 *  Sharing goes with its people, so the server checks them together. */
function changedFields(body: WriteBody, initial: Initial): Partial<WriteBody> {
  const segment = initial.segment;
  if (!segment) return body;
  const patch: Partial<WriteBody> = {};
  if (body.name !== segment.name) patch.name = body.name;
  if (body.description !== segment.description) patch.description = body.description;
  if (JSON.stringify(body.rules) !== JSON.stringify(toRules(initial.draft))) patch.rules = body.rules;
  const people = segment.sharing === 'people' ? segment.shared_with.map((person) => person.id) : [];
  if (body.sharing !== segment.sharing || !sameIds(body.shared_with ?? [], people)) {
    patch.sharing = body.sharing;
    if (body.shared_with) patch.shared_with = body.shared_with;
  }
  if (body.alert_on_changes !== segment.alert_on_changes) patch.alert_on_changes = body.alert_on_changes;
  return patch;
}

function fromSegment(segment: Segment): Initial {
  return { segment, kind: segment.kind, draft: fromRules(segment.rules), notes: [], labels: segment.labels, nameIds: NO_IDS };
}

/** /segments/new and /segments/:id/edit (spec §3): basics, the rules with a
 *  live preview beside them (stacked on phones), sharing and the alert. */
export function Builder() {
  const { id } = useParams();
  const [search] = useSearchParams();
  if (id === undefined) return <NewBuilder search={search} />;
  if (!/^\d+$/.test(id)) {
    return (
      <OrganizationsFrame>
        <SegmentMissing />
      </OrganizationsFrame>
    );
  }
  return <EditBuilder key={id} id={Number(id)} />;
}

function NewBuilder({ search }: { search: URLSearchParams }) {
  const [initial] = useState(() => fromList(search));
  return <BuilderForm initial={initial} />;
}

function EditBuilder({ id }: { id: number }) {
  const [load, , retry] = useSegment(id);
  const initial = useMemo(() => (load.status === 'ready' && load.segment.is_owner ? fromSegment(load.segment) : null), [load]);
  if (initial) return <BuilderForm initial={initial} />;
  return (
    <OrganizationsFrame>
      {load.status === 'loading' ? <SegmentLoading /> : null}
      {load.status === 'missing' ? <SegmentMissing /> : null}
      {load.status === 'failed' ? <SegmentFailed message={load.message} onRetry={retry} /> : null}
      {load.status === 'ready' ? <ReadOnly segment={load.segment} /> : null}
    </OrganizationsFrame>
  );
}

/** Someone else's segment (plan Decision 4): only its owner edits it. */
function ReadOnly({ segment }: { segment: Segment }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const duplicate = async () => {
    setBusy(true);
    setError(null);
    try {
      const copy = await duplicateSegment(segment.id);
      navigate(`/segments/${copy.id}/edit`);
    } catch (err) {
      setError(errorMessage(err, 'Could not duplicate this segment.'));
      setBusy(false);
    }
  };
  return (
    <EmptyState
      title={`Only ${segment.owner.name} can edit this segment`}
      detail="Duplicate it to make your own copy, then edit that."
      action={
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2">
            <Link to={`/segments/${segment.id}`} className={`${QUIET} border border-line`}>
              Open segment
            </Link>
            <button type="button" onClick={() => void duplicate()} disabled={busy} className={PRIMARY}>
              {busy ? 'Duplicating…' : 'Duplicate to edit'}
            </button>
          </div>
          {error ? (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
        </div>
      }
    />
  );
}

function BuilderForm({ initial }: { initial: Initial }) {
  const navigate = useNavigate();
  const me = useAppSelector((state) => state.auth.user?.id ?? null);
  const members = useMembers();
  const attributes = useAttributes();
  const products = useProducts();
  const editing = initial.segment;
  const nameId = useId();
  const descriptionId = useId();
  const kindName = useId();

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [kind, setKind] = useState<SegmentKind>(initial.kind);
  const [draft, setDraft] = useState<DraftRules>(initial.draft);
  const [sharing, setSharing] = useState<Sharing>(editing?.sharing ?? 'private');
  const [sharedWith, setSharedWith] = useState<PersonRef[]>(editing?.shared_with ?? []);
  const [alertOn, setAlertOn] = useState(editing?.alert_on_changes ?? false);
  const [labels, setLabels] = useState<RuleLabels>(initial.labels);
  const [errors, setErrors] = useState<FormErrors>({});
  const [invalidUid, setInvalidUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Save as segment: name the organisations and accounts the list named.
  // An id that does not come back stays "an organisation you can't open".
  const nameIds = JSON.stringify(initial.nameIds);
  useEffect(() => {
    const ids = JSON.parse(nameIds) as ListRules['ids'];
    if (ids.customer.length === 0 && ids.account.length === 0) return;
    let alive = true;
    Promise.all([fetchRecordNames('customer', ids.customer), fetchRecordNames('account', ids.account)]).then(
      ([organisations, accounts]) => {
        if (!alive) return;
        setLabels((current) => ({
          ...current,
          organisations: { ...current.organisations, ...organisations },
          accounts: { ...current.accounts, ...accounts },
        }));
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [nameIds]);

  const fields = useMemo(() => fieldsFor(kind, attributes), [kind, attributes]);
  const fieldOf = useCallback((key: string) => fields.find((field) => field.key === key) ?? null, [fields]);
  const people = useMemo(() => members.filter((m) => m.is_active).map((m) => ({ id: m.id, name: m.name })), [members]);
  const teammates = useMemo(() => people.filter((person) => person.id !== me), [people, me]);
  // Someone deactivated since the segment was shared can't be saved again
  // (the server takes active teammates only): drop them once the members
  // have loaded, and say how many went.
  const loaded = members.length > 0;
  const shared = useMemo(
    () => (loaded ? sharedWith.filter((person) => teammates.some((teammate) => teammate.id === person.id)) : sharedWith),
    [loaded, sharedWith, teammates],
  );
  const removed = loaded && editing ? editing.shared_with.filter((person) => !teammates.some((teammate) => teammate.id === person.id)).length : 0;
  const complete = firstIncomplete(draft, fieldOf) === null;
  const request = useMemo<PreviewRequest | null>(
    () => (complete ? { kind, rules: toRules(draft), pinned_ids: editing?.pinned_ids ?? [], excluded_ids: editing?.excluded_ids ?? [] } : null),
    [complete, kind, draft, editing],
  );
  const preview = usePreview(request);
  const options = useMemo<ValueOptions>(
    () => ({
      people,
      products,
      labels,
      onNamed: (group, id, picked) => setLabels((current) => ({ ...current, [group]: { ...current[group], [String(id)]: picked } })),
    }),
    [people, products, labels],
  );
  const rulesError = errors.rules ?? (preview.status === 'error' ? preview.message : null);

  const changeKind = (next: SegmentKind) => {
    setKind(next);
    setDraft(fromRules(null));
    setInvalidUid(null);
  };

  async function save(event: FormEvent) {
    event.preventDefault();
    const body = {
      name: name.trim(),
      description: description.trim(),
      rules: toRules(draft),
      sharing,
      ...(sharing === 'people' ? { shared_with: shared.map((person) => person.id) } : {}),
      alert_on_changes: alertOn,
    };
    const patch = editing ? changedFields(body, initial) : null;
    // Unchanged saved rules are not sent, so they are not re-checked either
    // (an AI attribute's field may not have loaded yet).
    const unfinished = !patch || 'rules' in patch ? firstIncomplete(draft, fieldOf) : null;
    const found: FormErrors = {};
    if (!body.name) found.name = 'Give the segment a name.';
    if (unfinished) found.rules = 'Finish each condition, or remove it.';
    if (sharing === 'people' && shared.length === 0) found.shared_with = 'Choose at least one teammate.';
    setInvalidUid(unfinished);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (editing && patch && Object.keys(patch).length === 0) {
      navigate(`/segments/${editing.id}`);
      return;
    }
    setSaving(true);
    try {
      // PATCH sends only what changed (ruling G14), never `kind`.
      const saved = editing && patch ? await updateSegment(editing.id, patch) : await createSegment({ ...body, kind });
      navigate(`/segments/${saved.id}`);
    } catch (err) {
      setErrors(formErrors(err));
      setSaving(false);
    }
  }

  return (
    <OrganizationsFrame>
      <form onSubmit={(event) => void save(event)} noValidate className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 pb-6">
        <h1 className="text-[22px] font-semibold text-ink">{editing ? `Edit ${editing.name}` : 'New segment'}</h1>
        {errors.form ? (
          <p role="alert" className="text-[13px] text-danger">
            {errors.form}
          </p>
        ) : null}
        {initial.notes.length > 0 ? (
          <ul aria-label="From the list" className="flex flex-col gap-1 rounded-xl bg-surface p-3 text-[13px] text-ink-muted">
            {initial.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}

        <section aria-label="Basics" className="flex flex-col gap-3 rounded-xl bg-surface p-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={nameId} className="text-[13px] font-semibold text-ink">
              Name
            </label>
            <input
              id={nameId}
              value={name}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${nameId}-error` : undefined}
              className={`${INPUT} ${errors.name ? 'border-danger' : 'border-line'}`}
            />
            {errors.name ? (
              <p id={`${nameId}-error`} role="alert" className="text-[11px] text-danger">
                {errors.name}
              </p>
            ) : null}
          </div>
          {editing ? (
            <p className="text-[13px] text-ink">
              <span className="font-semibold">Kind:</span> {KIND_LABEL[kind]} <span className="text-ink-muted">· A segment's kind can't change.</span>
            </p>
          ) : (
            <fieldset aria-describedby={errors.kind ? `${kindName}-error` : undefined} className="flex flex-col gap-1">
              <legend className="text-[13px] font-semibold text-ink">Kind</legend>
              <div className="flex flex-wrap gap-x-4">
                {KINDS.map((option) => (
                  <Radio key={option} name={kindName} label={KIND_LABEL[option]} checked={kind === option} onChange={() => changeKind(option)} />
                ))}
              </div>
              {errors.kind ? (
                <p id={`${kindName}-error`} role="alert" className="text-[11px] text-danger">
                  {errors.kind}
                </p>
              ) : null}
            </fieldset>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor={descriptionId} className="text-[13px] font-semibold text-ink">
              Description <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <textarea
              id={descriptionId}
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
              className={`${INPUT} ${errors.description ? 'border-danger' : 'border-line'} py-2`}
            />
            {errors.description ? (
              <p id={`${descriptionId}-error`} role="alert" className="text-[11px] text-danger">
                {errors.description}
              </p>
            ) : null}
          </div>
        </section>

        <div data-part="rules-and-preview" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-2">
            <RuleEditor
              draft={draft}
              fields={fields}
              options={options}
              invalidUid={invalidUid}
              error={rulesError}
              onChange={(next) => {
                setDraft(next);
                setInvalidUid(null);
                // A save's rules error (errors.rules) would otherwise hide the
                // live preview's own message (rulesError's `??`) forever.
                setErrors((current) => (current.rules ? { ...current, rules: undefined } : current));
              }}
            />
            {kind === 'customer' ? (
              // Ruling G25: the compiler's default, which the rows can't show.
              <p className="px-3 text-[11px] text-ink-muted">Churned and archived organisations are left out unless a rule names them.</p>
            ) : null}
          </div>
          <PreviewPanel kind={kind} state={preview} />
        </div>

        <section aria-label="Sharing and alerts" className="flex flex-col gap-4 rounded-xl bg-surface p-3">
          {removed > 0 ? (
            <p className="text-[11px] text-ink-muted">
              <span className={MONO}>{removed}</span> {removed === 1 ? 'person' : 'people'} no longer in your workspace {removed === 1 ? 'was' : 'were'} removed.
            </p>
          ) : null}
          <SharingFields
            sharing={sharing}
            sharedWith={shared}
            teammates={teammates}
            error={errors.shared_with ?? errors.sharing ?? null}
            onChange={(nextSharing, nextPeople) => {
              setSharing(nextSharing);
              setSharedWith(nextPeople);
            }}
          />
          <div className="flex flex-col gap-0.5">
            <label className="flex min-h-11 items-center gap-2 text-[13px] text-ink sm:min-h-9">
              <input type="checkbox" checked={alertOn} onChange={(event) => setAlertOn(event.target.checked)} className={`h-4 w-4 accent-accent ${FOCUS}`} />
              Alert me on changes
            </label>
            <p className="text-[11px] text-ink-muted">Once a day, in your notifications, when anyone enters or leaves.</p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={saving} className={PRIMARY}>
            {saving ? 'Saving…' : 'Save segment'}
          </button>
          <Link to={editing ? `/segments/${editing.id}` : '/segments'} className={QUIET}>
            Cancel
          </Link>
        </div>
      </form>
    </OrganizationsFrame>
  );
}
