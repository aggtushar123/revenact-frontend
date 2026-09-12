import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { CurrencyCode } from '../auth/authSlice';

// Mirrors revenact-backend's MetricListView exactly — see docs/API_CONTRACTS.md
// -> metrics -> GET /api/v1/metrics/.
//
// The metric layer: every headline number defined once on the backend, read
// through the same rollups the dashboards draw, whole-organisation, with the
// last month-end beside it. Phase 1 of the company brain.

export type MetricUnit = 'money' | 'percent' | 'count';
/** Which direction is good news. 'none' is context, not a target. */
export type MetricDirection = 'up' | 'down' | 'none';

export interface Metric {
  key: string;
  label: string;
  unit: MetricUnit;
  better: MetricDirection;
  note: string;
  /** Null when unmeasured — an empty book has no NRR — never zero. */
  value: number | null;
  /** The most recent month-end snapshot, null before the first is recorded. */
  previous: { period_end: string; value: number | null } | null;
  /** Null whenever either side is unmeasured: "unknown" to 40 is not a rise of 40. */
  change: number | null;
  /** The cuts this metric has — 'owner', 'product', 'segment', 'lifecycle'. */
  dimensions: string[];
}

/** One member of a cut: an owner, a product, a size band, a lifecycle stage. */
export interface SliceMember {
  member: string;
  label: string;
  value: number | null;
  previous: { period_end: string; value: number | null } | null;
  change: number | null;
}

export interface SlicePayload {
  metric: Pick<Metric, 'key' | 'label' | 'unit' | 'better' | 'note' | 'dimensions'>;
  dimension: { key: string; label: string };
  currency: CurrencyCode;
  members: SliceMember[];
}

/** A member that moved a signalled metric. */
export interface Driver {
  dimension: string;
  dimension_label: string;
  member: string;
  label: string;
  value: number;
  change: number;
}

/** A metric that moved materially since the last month-end. */
export interface Signal extends Omit<Metric, 'previous' | 'change' | 'value'> {
  value: number;
  previous: { period_end: string; value: number };
  change: number;
  /** Null when the metric's `better` is 'none'. */
  improved: boolean | null;
  drivers: Driver[];
}

export interface SignalsPayload {
  as_of: string;
  /** The month-end everything is compared against; null before the first exists. */
  baseline: string | null;
  currency: CurrencyCode;
  signals: Signal[];
}

export interface MetricsPayload {
  as_of: string;
  currency: CurrencyCode;
  metrics: Metric[];
}

/** The management brief — the metric layer written out by Claude. */
export interface Brief {
  id: number;
  as_of: string;
  baseline: string | null;
  headline: string;
  /** Paragraphs separated by blank lines. */
  body: string;
  watch: string[];
  generated_at: string;
  generated_by: string | null;
}

/** Why one metric is where it is, in Claude's words, as of one day. */
export interface Explanation {
  id: number;
  metric: string;
  metric_label: string;
  as_of: string;
  baseline: string | null;
  value: number | null;
  previous_value: number | null;
  text: string;
  /** The figures the model cited, as they were given to it. */
  evidence: string[];
  generated_at: string;
  generated_by: string | null;
}

interface MetricsState {
  data: MetricsPayload | null;
  isLoading: boolean;
  error: string | null;
  signals: SignalsPayload | null;
  signalsError: string | null;
  /** Keyed `${metric}:${dimension}` — a cut fetched once is kept. */
  slices: Record<string, SlicePayload>;
  sliceLoading: string | null;
  sliceError: string | null;
  /** Null before the first brief is written; undefined until fetched. */
  brief: Brief | null | undefined;
  briefGenerating: boolean;
  briefError: string | null;
  /** Per metric key: null before one is written; absent until fetched. */
  explanations: Record<string, Explanation | null>;
  explaining: string | null;
  explainErrors: Record<string, string>;
}

const initialState: MetricsState = {
  data: null,
  isLoading: false,
  error: null,
  signals: null,
  signalsError: null,
  slices: {},
  sliceLoading: null,
  sliceError: null,
  brief: undefined,
  briefGenerating: false,
  briefError: null,
  explanations: {},
  explaining: null,
  explainErrors: {},
};

export const fetchExplanation = createAsyncThunk<
  { key: string; explanation: Explanation | null },
  string,
  { rejectValue: string }
>('metrics/fetchExplanation', async (key, { rejectWithValue }) => {
  try {
    const { explanation } = await apiFetch<{ explanation: Explanation | null }>(`/metrics/${key}/explanation/`);
    return { key, explanation };
  } catch (err) {
    return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load the explanation.');
  }
});

/** A real, paid model call — only ever from an explicit click. */
export const generateExplanation = createAsyncThunk<
  { key: string; explanation: Explanation },
  string,
  { rejectValue: string }
>('metrics/generateExplanation', async (key, { rejectWithValue }) => {
  try {
    const { explanation } = await apiFetch<{ explanation: Explanation }>(`/metrics/${key}/explain/`, { method: 'POST' });
    return { key, explanation };
  } catch (err) {
    return rejectWithValue(err instanceof ApiError ? err.message : 'Could not write the explanation.');
  }
});

export const fetchBrief = createAsyncThunk<Brief | null, void, { rejectValue: string }>(
  'metrics/fetchBrief',
  async (_, { rejectWithValue }) => {
    try {
      return (await apiFetch<{ brief: Brief | null }>('/metrics/brief/')).brief;
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load the brief.');
    }
  }
);

/** A real, paid model call — only ever from an explicit click. */
export const generateBrief = createAsyncThunk<Brief, void, { rejectValue: string }>(
  'metrics/generateBrief',
  async (_, { rejectWithValue }) => {
    try {
      return (await apiFetch<{ brief: Brief }>('/metrics/brief/generate/', { method: 'POST' })).brief;
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not write the brief.');
    }
  }
);

export const sliceKey = (metric: string, dimension: string) => `${metric}:${dimension}`;

export const fetchSignals = createAsyncThunk<SignalsPayload, void, { rejectValue: string }>(
  'metrics/fetchSignals',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<SignalsPayload>('/metrics/signals/');
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load the signals.');
    }
  }
);

export const fetchMetricSlice = createAsyncThunk<
  SlicePayload,
  { metric: string; dimension: string },
  { rejectValue: string }
>('metrics/fetchSlice', async ({ metric, dimension }, { rejectWithValue }) => {
  try {
    return await apiFetch<SlicePayload>(`/metrics/${metric}/by/${dimension}/`);
  } catch (err) {
    return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load that cut.');
  }
});

export const fetchMetrics = createAsyncThunk<MetricsPayload, void, { rejectValue: string }>(
  'metrics/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<MetricsPayload>('/metrics/');
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load the metrics.');
    }
  }
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the metrics.';
      })
      .addCase(fetchSignals.pending, (state) => {
        state.signalsError = null;
      })
      .addCase(fetchSignals.fulfilled, (state, action) => {
        state.signals = action.payload;
      })
      .addCase(fetchSignals.rejected, (state, action) => {
        state.signalsError = action.payload ?? 'Could not load the signals.';
      })
      .addCase(fetchMetricSlice.pending, (state, action) => {
        state.sliceLoading = sliceKey(action.meta.arg.metric, action.meta.arg.dimension);
        state.sliceError = null;
      })
      .addCase(fetchMetricSlice.fulfilled, (state, action) => {
        state.sliceLoading = null;
        state.slices[sliceKey(action.payload.metric.key, action.payload.dimension.key)] =
          action.payload;
      })
      .addCase(fetchMetricSlice.rejected, (state, action) => {
        state.sliceLoading = null;
        state.sliceError = action.payload ?? 'Could not load that cut.';
      })
      .addCase(fetchBrief.fulfilled, (state, action) => {
        state.brief = action.payload;
      })
      .addCase(fetchBrief.rejected, (state, action) => {
        state.brief = null;
        state.briefError = action.payload ?? 'Could not load the brief.';
      })
      .addCase(generateBrief.pending, (state) => {
        state.briefGenerating = true;
        state.briefError = null;
      })
      .addCase(generateBrief.fulfilled, (state, action) => {
        state.briefGenerating = false;
        state.brief = action.payload;
      })
      .addCase(generateBrief.rejected, (state, action) => {
        state.briefGenerating = false;
        state.briefError = action.payload ?? 'Could not write the brief.';
      })
      .addCase(fetchExplanation.fulfilled, (state, action) => {
        state.explanations[action.payload.key] = action.payload.explanation;
      })
      .addCase(fetchExplanation.rejected, (state, action) => {
        state.explainErrors[action.meta.arg] = action.payload ?? 'Could not load the explanation.';
      })
      .addCase(generateExplanation.pending, (state, action) => {
        state.explaining = action.meta.arg;
        delete state.explainErrors[action.meta.arg];
      })
      .addCase(generateExplanation.fulfilled, (state, action) => {
        state.explaining = null;
        state.explanations[action.payload.key] = action.payload.explanation;
      })
      .addCase(generateExplanation.rejected, (state, action) => {
        state.explaining = null;
        state.explainErrors[action.meta.arg] = action.payload ?? 'Could not write the explanation.';
      });
  },
});

export default metricsSlice.reducer;
