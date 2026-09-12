import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';

// Mirrors revenact-backend's proposal payloads exactly — see
// docs/API_CONTRACTS.md -> metrics -> proposals.
//
// The review queue: actions the Ops agent proposed, waiting for a person.
// Nothing here runs until someone approves it, and approval executes
// through the same paths a person uses by hand.

export type ProposalKind = 'task' | 'initiative';
export type ProposalStatus = 'proposed' | 'approved' | 'rejected';

export interface TaskAction {
  customer_id: number;
  customer_name: string;
  title: string;
  assignee_name: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InitiativeAction {
  metric: string;
  metric_label: string;
  dimension: string;
  member: string;
  member_label: string;
  target_value: number;
  target_by: string;
}

export interface Proposal {
  id: number;
  batch: string;
  kind: ProposalKind;
  kind_display: string;
  title: string;
  rationale: string;
  /** The figures the agent cited, as they were given to it. */
  evidence: string[];
  action: TaskAction | InitiativeAction;
  initiative: { id: number; title: string } | null;
  status: ProposalStatus;
  status_display: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string;
  result: Record<string, number>;
  generated_by: string | null;
  /** Set when the facilitator wrote this from a multiplayer session's decisions. */
  source: { session_id: number; conversation_id: number; title: string } | null;
  created_at: string;
}

interface ProposalsState {
  items: Proposal[];
  pending: number;
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  generateError: string | null;
  decidingId: number | null;
  decideError: string | null;
}

const initialState: ProposalsState = {
  items: [],
  pending: 0,
  isLoading: false,
  error: null,
  isGenerating: false,
  generateError: null,
  decidingId: null,
  decideError: null,
};

const message = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

export const fetchProposals = createAsyncThunk<
  { pending: number; proposals: Proposal[] },
  void,
  { rejectValue: string }
>('proposals/fetch', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<{ pending: number; proposals: Proposal[] }>('/metrics/proposals/');
  } catch (err) {
    return rejectWithValue(message(err, 'Could not load the review queue.'));
  }
});

/** A real, paid model call — only ever from an explicit click. */
export const generateProposals = createAsyncThunk<Proposal[], void, { rejectValue: string }>(
  'proposals/generate',
  async (_, { rejectWithValue }) => {
    try {
      return (
        await apiFetch<{ proposals: Proposal[] }>('/metrics/proposals/generate/', { method: 'POST' })
      ).proposals;
    } catch (err) {
      return rejectWithValue(message(err, 'Could not ask the agent for proposals.'));
    }
  }
);

export const decideProposal = createAsyncThunk<
  Proposal,
  { id: number; decision: 'approve' | 'reject'; note?: string },
  { rejectValue: string }
>('proposals/decide', async ({ id, decision, note }, { rejectWithValue }) => {
  try {
    return (
      await apiFetch<{ proposal: Proposal }>(`/metrics/proposals/${id}/${decision}/`, {
        method: 'POST',
        body: { note: note ?? '' },
      })
    ).proposal;
  } catch (err) {
    return rejectWithValue(message(err, 'Could not record that decision.'));
  }
});

const proposalsSlice = createSlice({
  name: 'proposals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.proposals;
        state.pending = action.payload.pending;
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the review queue.';
      })
      .addCase(generateProposals.pending, (state) => {
        state.isGenerating = true;
        state.generateError = null;
      })
      .addCase(generateProposals.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.items = [...action.payload, ...state.items];
        state.pending += action.payload.length;
      })
      .addCase(generateProposals.rejected, (state, action) => {
        state.isGenerating = false;
        state.generateError = action.payload ?? 'Could not ask the agent for proposals.';
      })
      .addCase(decideProposal.pending, (state, action) => {
        state.decidingId = action.meta.arg.id;
        state.decideError = null;
      })
      .addCase(decideProposal.fulfilled, (state, action) => {
        state.decidingId = null;
        const wasPending = state.items.find((p) => p.id === action.payload.id)?.status === 'proposed';
        state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p));
        if (wasPending) state.pending = Math.max(0, state.pending - 1);
      })
      .addCase(decideProposal.rejected, (state, action) => {
        state.decidingId = null;
        state.decideError = action.payload ?? 'Could not record that decision.';
      });
  },
});

export default proposalsSlice.reducer;
