import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { CurrencyCode } from '../auth/authSlice';

// Mirrors revenact-backend's /api/v1/metrics/graph/ — see docs/API_CONTRACTS.md
// -> metrics -> the knowledge graph. Real relations, the dashboards' own figures.

export type NodeKind = 'owner' | 'customer' | 'product' | 'initiative' | 'proposal';

interface BaseNode {
  id: string;
  kind: NodeKind;
  label: string;
}
export interface CustomerNode extends BaseNode {
  kind: 'customer';
  arr: number;
  downside: number;
  risk: number;
  health_category: 'good' | 'average' | 'poor';
  health_score: number | null;
  days_to_renewal: number | null;
  open_tasks: number;
}
export interface GroupNode extends BaseNode {
  kind: 'product' | 'owner';
  customers: number;
  arr: number;
  downside: number;
}
export interface InitiativeNode extends BaseNode {
  kind: 'initiative';
  status: 'planned' | 'active';
  metric: string;
  metric_label: string;
  member_label: string;
  target_value: number | null;
  target_by: string;
  owner: string | null;
}
export interface ProposalNode extends BaseNode {
  kind: 'proposal';
  proposal_kind: 'task' | 'initiative';
  from_session: string | null;
}
export type GraphNode = CustomerNode | GroupNode | InitiativeNode | ProposalNode;

export interface GraphEdge {
  from: string;
  to: string;
  kind: 'owns' | 'runs_on' | 'targets' | 'acts_on' | 'serves';
}

export interface GraphPayload {
  as_of: string;
  currency: CurrencyCode;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphState {
  data: GraphPayload | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GraphState = { data: null, isLoading: false, error: null };

export const fetchGraph = createAsyncThunk<GraphPayload, void, { rejectValue: string }>(
  'graph/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<GraphPayload>('/metrics/graph/');
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load the graph.');
    }
  }
);

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGraph.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGraph.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchGraph.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the graph.';
      });
  },
});

export default graphSlice.reducer;
