import type { ReactNode } from 'react';
import type { SurfaceContext } from '../../pages/copilot/types';

/** What the rail's questions are about.
 *  - `label`: Communications. Sent as a `[About: <label>] ` text prefix, as always.
 *  - `surface`: the Dashboard or Organizations. Sent as the structured
 *    `context` field with no prefix; `label` is the chip text, e.g.
 *    "Revenue › Forecast · Owner: Priya" or "Organizations · Owner: Carl CSM". */
export type RailContext =
  | { kind: 'label'; label: string; icon?: ReactNode }
  | { kind: 'surface'; context: SurfaceContext; label: string };
