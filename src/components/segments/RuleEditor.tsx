import { useId } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  addCondition,
  addGroup,
  conditionCount,
  isDraftGroup,
  leaves,
  removeNode,
  setMatch,
  updateCondition,
  withField,
  withOp,
  type DraftCondition,
  type DraftRules,
} from '../../features/segments/ruleDraft';
import { opText } from '../../features/segments/ruleSentence';
import { MAX_CONDITIONS, operatorsOf, type FieldDef } from '../../features/segments/segmentFields';
import type { Match, Operator } from '../../features/segments/segmentTypes';
import { FILTER_SELECT } from '../organizations/portfolio/filterParts';
import { BUTTON, COLUMN_ICON_BUTTON, MONO } from '../organizations/portfolio/styles';
import { Switch } from '../organizations/portfolio/tileParts';
import { ValueInput, type ValueOptions } from './ValueInput';

const MATCHES: { value: Match; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'any', label: 'Any' },
];
/** The shared filter box, with a danger border on an unfinished row. */
const SELECT = `${FILTER_SELECT} aria-[invalid=true]:border-danger`;
const SECTIONS = [
  { key: 'own', label: 'Fields' },
  { key: 'parent', label: 'Their organisation or account' },
  { key: 'attribute', label: 'AI attributes' },
] as const;

export interface RuleEditorProps {
  draft: DraftRules;
  /** The kind's fields; the first is what + Add condition starts on. */
  fields: FieldDef[];
  /** Passed to every value input. The caller owns `labels` and should merge
   *  each `onNamed` pick into them, or a just-picked record's chip reads
   *  "an organisation you can't open". */
  options: ValueOptions;
  /** The condition Save found unfinished. */
  invalidUid: string | null;
  /** A save's or the preview's `rules` 400. */
  error: string | null;
  onChange: (draft: DraftRules) => void;
}

function FieldSelect({ fields, value, label, invalid, onChange }: {
  fields: FieldDef[];
  value: string;
  label: string;
  invalid: boolean;
  onChange: (key: string) => void;
}) {
  const known = fields.some((field) => field.key === value);
  return (
    <select aria-label={label} aria-invalid={invalid && !known} value={value} onChange={(event) => onChange(event.target.value)} className={`${SELECT} max-w-[16rem]`}>
      {known ? null : <option value={value}>{value}</option>}
      {SECTIONS.map((section) => {
        const inSection = fields.filter((field) => field.section === section.key);
        return inSection.length > 0 ? (
          <optgroup key={section.key} label={section.label}>
            {inSection.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </optgroup>
        ) : null;
      })}
    </select>
  );
}

function ConditionRow({ condition, number, fields, options, invalid, onChange, onRemove }: {
  condition: DraftCondition;
  number: number;
  fields: FieldDef[];
  options: ValueOptions;
  invalid: boolean;
  onChange: (condition: DraftCondition) => void;
  onRemove: () => void;
}) {
  const field = fields.find((f) => f.key === condition.field) ?? null;
  const name = `Condition ${number}`;
  return (
    <li data-condition={condition.uid} className={`flex flex-wrap items-center gap-2 rounded-lg border bg-surface p-2 ${invalid ? 'border-danger' : 'border-line'}`}>
      <FieldSelect
        fields={fields}
        value={condition.field}
        label={`${name} field`}
        invalid={invalid}
        onChange={(key) => {
          const next = fields.find((f) => f.key === key);
          if (next) onChange(withField(condition, next));
        }}
      />
      <select
        aria-label={`${name} operator`}
        value={condition.op}
        disabled={!field}
        onChange={(event) => {
          if (field) onChange(withOp(condition, field, event.target.value as Operator));
        }}
        className={SELECT}
      >
        {(field ? operatorsOf(field) : [condition.op]).map((op) => (
          <option key={op} value={op}>
            {opText(op, field)}
          </option>
        ))}
      </select>
      {field ? (
        <ValueInput field={field} condition={condition} options={options} label={`${name} value`} invalid={invalid} onChange={(value) => onChange({ ...condition, value })} />
      ) : null}
      <button type="button" onClick={onRemove} aria-label={`Remove condition ${number}`} className={`${COLUMN_ICON_BUTTON} ml-auto`}>
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      {invalid ? (
        <p className="basis-full text-[11px] text-danger">
          {field ? 'Finish this condition, or remove it.' : 'This field no longer exists. Choose another, or remove it.'}
        </p>
      ) : null}
    </li>
  );
}

/** The rules as readable rows (spec §3): an All/Any switch, conditions and
 *  one level of groups, + Add condition and + Add group, the right value
 *  input per field. */
export function RuleEditor({ draft, fields, options, invalidUid, error, onChange }: RuleEditorProps) {
  const headingId = useId();
  const count = conditionCount(draft);
  const full = count >= MAX_CONDITIONS;
  const first = fields[0];
  const numbers = new Map(leaves(draft).map((condition, index) => [condition.uid, index + 1]));
  const groupNumbers = new Map(draft.conditions.filter(isDraftGroup).map((group, index) => [group.uid, index + 1]));

  const row = (condition: DraftCondition) => (
    <ConditionRow
      key={condition.uid}
      condition={condition}
      number={numbers.get(condition.uid) ?? 0}
      fields={fields}
      options={options}
      invalid={condition.uid === invalidUid}
      onChange={(next) => onChange(updateCondition(draft, condition.uid, () => next))}
      onRemove={() => onChange(removeNode(draft, condition.uid))}
    />
  );

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3 rounded-xl bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-[15px] font-semibold text-ink">
          Rules
        </h2>
        <Switch label="Match" options={MATCHES} value={draft.match} onChange={(match) => onChange(setMatch(draft, match))} />
      </div>
      <p className="text-[13px] text-ink-muted">{draft.match === 'all' ? 'Members match every condition.' : 'Members match at least one condition.'}</p>
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      {draft.conditions.length === 0 ? (
        <p className="text-[13px] text-ink-muted">No conditions yet. With none, only pinned records are members.</p>
      ) : (
        <ul aria-label="Conditions" className="flex flex-col gap-2">
          {draft.conditions.map((node) => {
            if (!isDraftGroup(node)) return row(node);
            const n = groupNumbers.get(node.uid) ?? 0;
            return (
              <li key={node.uid} data-group={node.uid} className="flex flex-col gap-2 rounded-lg bg-subtle p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">Group</span>
                  <Switch label={`Group ${n} match`} options={MATCHES} value={node.match} onChange={(match) => onChange(setMatch(draft, match, node.uid))} />
                  <span className="text-[11px] text-ink-muted">{node.match === 'all' ? 'every one of these' : 'any one of these'}</span>
                  <button type="button" onClick={() => onChange(removeNode(draft, node.uid))} aria-label={`Remove group ${n}`} className={`${COLUMN_ICON_BUTTON} ml-auto`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <ul aria-label={`Group ${n} conditions`} className="flex flex-col gap-2">
                  {node.conditions.map(row)}
                </ul>
                <button type="button" disabled={full} onClick={() => onChange(addCondition(draft, first, node.uid))} className={`${BUTTON} self-start`}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add condition to group
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={full} onClick={() => onChange(addCondition(draft, first))} className={BUTTON}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add condition
        </button>
        <button type="button" disabled={full} onClick={() => onChange(addGroup(draft, first))} className={BUTTON}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add group
        </button>
        {full ? (
          <p className="text-[11px] text-ink-muted">
            A segment can have at most <span className={MONO}>{MAX_CONDITIONS}</span> conditions.
          </p>
        ) : count > 0 ? (
          <p className="text-[11px] text-ink-muted">
            <span className={MONO}>{count}</span> of <span className={MONO}>{MAX_CONDITIONS}</span> conditions
          </p>
        ) : null}
      </div>
    </section>
  );
}
