import { useId } from 'react';
import type { PersonRef, Sharing } from '../../features/segments/segmentTypes';
import { Lock, Users, UsersRound } from 'lucide-react';
import { FILTER_SELECT } from '../organizations/portfolio/filterParts';
import { Chip } from './Chip';
import { RadioTile } from './RadioTile';

const OPTIONS = [
  { value: 'private', label: 'Only me', icon: Lock },
  { value: 'workspace', label: 'Everyone in the workspace', icon: Users },
  { value: 'people', label: 'Chosen teammates', icon: UsersRound },
] as const satisfies readonly { value: Sharing; label: string; icon: unknown }[];
/** The backend's MAX_SHARED. */
const MAX_SHARED = 50;

/** Private, the workspace, or chosen teammates (spec Decisions, Sharing),
 *  with a people picker of active teammates. Leaving "Chosen teammates"
 *  clears the choice, as the backend does. */
export function SharingFields({ sharing, sharedWith, teammates, error, onChange }: {
  sharing: Sharing;
  sharedWith: PersonRef[];
  /** Active people in the workspace, the owner left out. */
  teammates: PersonRef[];
  error: string | null;
  onChange: (sharing: Sharing, sharedWith: PersonRef[]) => void;
}) {
  const name = useId();
  const rest = teammates.filter((person) => !sharedWith.some((chosen) => chosen.id === person.id));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[15px] font-semibold text-ink">Sharing</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <RadioTile
            key={option.value}
            name={name}
            label={option.label}
            icon={option.icon}
            checked={sharing === option.value}
            onChange={() => onChange(option.value, option.value === 'people' ? sharedWith : [])}
          />
        ))}
      </div>
      <p className="text-[11px] text-ink-muted">Teammates see the same rules, but only the members they may open, and a count of the rest. Only you can change it.</p>
      {sharing === 'people' ? (
        <div className="flex flex-col gap-2">
          {sharedWith.length > 0 ? (
            <ul aria-label="Shared with" className="flex flex-wrap gap-1.5">
              {sharedWith.map((person) => (
                <Chip key={person.id} name={person.name} onRemove={() => onChange('people', sharedWith.filter((chosen) => chosen.id !== person.id))} />
              ))}
            </ul>
          ) : null}
          <select
            aria-label="Add a teammate"
            value=""
            disabled={sharedWith.length >= MAX_SHARED}
            onChange={(event) => {
              const person = rest.find((candidate) => String(candidate.id) === event.target.value);
              if (person) onChange('people', [...sharedWith, person]);
            }}
            className={`${FILTER_SELECT} self-start`}
          >
            <option value="">Add a teammate…</option>
            {rest.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
