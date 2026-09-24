import type { ReactNode } from 'react';
import type { DashboardContext } from '../../pages/copilot/types';

/** What the rail's questions are about.
 *  - `label`: Communications. Sent as a `[About: <label>] ` text prefix, as always.
 *  - `dashboard`: sent as the structured `context` field with no prefix;
 *    `label` is the chip text, e.g. "Revenue › Forecast · Owner: Priya". */
export type RailContext =
  | { kind: 'label'; label: string; icon?: ReactNode }
  | { kind: 'dashboard'; context: DashboardContext; label: string };
