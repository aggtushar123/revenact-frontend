import { MoreHorizontal } from 'lucide-react';
import type { MemberStateValue } from '../../features/segments/segmentTypes';
import { MoveToMenu } from '../organizations/portfolio/MoveToMenu';

const CHOICES: Record<MemberStateValue, { value: MemberStateValue; label: string }[]> = {
  none: [
    { value: 'pinned', label: 'Pin' },
    { value: 'excluded', label: 'Keep out' },
  ],
  pinned: [
    { value: 'none', label: 'Unpin' },
    { value: 'excluded', label: 'Keep out' },
  ],
  excluded: [{ value: 'none', label: 'Let back in' }],
};

/** A member row's menu (owner only, spec §3): Pin keeps it in whatever the
 *  rules say, Keep out keeps it out. */
export function MemberMenu({
  name,
  state,
  disabled,
  onChoose,
}: {
  name: string;
  state: MemberStateValue;
  disabled: boolean;
  onChoose: (state: MemberStateValue) => void;
}) {
  return (
    <MoveToMenu
      name={name}
      disabled={disabled}
      note={null}
      targets={CHOICES[state]}
      onChoose={(value) => onChoose(value as MemberStateValue)}
      label={`Actions for ${name}`}
      menuLabel={`${name} actions`}
      icon={<MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
    />
  );
}
