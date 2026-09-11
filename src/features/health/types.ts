/**
 * The shape the Health Overview tabs read.
 *
 * Lived in `pages/dashboard/tabs/health-overview/mockData.ts` while the screen
 * ran on generated data. It's the domain type now — `toHealthDataRow` builds it
 * from `/api/v1/customers/health/`, and the mock is only a test fixture.
 */

export type HealthStatus = 'Poor' | 'Average' | 'Good';

export interface HealthHistoryEntry {
  /** Display label for the month, e.g. "Aug 31, 2026". */
  month: string;
  status: HealthStatus;
}

export interface HealthDataRow {
  id: string;
  account: string;
  /** The owning CSM's name, or a placeholder when unassigned. */
  owner: string;
  lifecycleStage: string;
  /** "MMM d, yyyy" — the shape `triage.daysToRenewal` parses. Empty when the
   *  account has no renewal date recorded. */
  renewalDate: string;
  healthStatus: HealthStatus;
  healthScore: number;
  /**
   * 1-5, or **null when nobody has rated it**.
   *
   * Null is a real state, not a missing value to paper over: an account the CSM
   * hasn't scored is not one they scored badly, and the Divergence view must
   * not read it as agreement. Every consumer handles null explicitly.
   */
  csmPulseScore: number | null;
  /** 1-5, or null when the model hasn't scored it. Named `aiPulseScore` for
   *  continuity with the screen, but it carries the backend's numeric
   *  `ai_pulse_value`, not the `ai_pulse_score` category string. */
  aiPulseScore: number | null;
  /** When the CSM pulse last changed, or null if it never has. */
  lastPulseModified: string | null;
  aiPulseReason: string;
  /**
   * Seats in active use. The mock called this `activeRecruiters` and invented
   * it; the backend has `total_active_seats` and no recruiter count at all.
   */
  activeSeats: number | null;
  /** Oldest month first. Empty when nothing has been recorded. */
  history: HealthHistoryEntry[];
}
