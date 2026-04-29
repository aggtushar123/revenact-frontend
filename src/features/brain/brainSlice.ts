import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  KnowledgeNode, Skill, Connector, FeedbackEntry, BrainMetrics, DomainCoverage
} from './types';
import {
  mockNodes, mockSkills, mockConnectors, mockFeedback, brainMetrics, domainCoverage
} from './mockData';

interface GraphFilters {
  domains: string[];
  confidenceThreshold: number;
  searchQuery: string;
}

interface BrainState {
  nodes: KnowledgeNode[];
  skills: Skill[];
  connectors: Connector[];
  feedbackLog: FeedbackEntry[];
  metrics: BrainMetrics;
  domainCoverage: DomainCoverage[];
  activeNodeId: string | null;
  graphFilters: GraphFilters;
  status: 'idle' | 'loading' | 'error';
}

const initialState: BrainState = {
  nodes: mockNodes,
  skills: mockSkills,
  connectors: mockConnectors,
  feedbackLog: mockFeedback,
  metrics: brainMetrics,
  domainCoverage: domainCoverage,
  activeNodeId: null,
  graphFilters: {
    domains: [],
    confidenceThreshold: 0,
    searchQuery: '',
  },
  status: 'idle',
};

const brainSlice = createSlice({
  name: 'brain',
  initialState,
  reducers: {
    // Node actions
    approveNode(state, action: PayloadAction<string>) {
      const node = state.nodes.find(n => n.id === action.payload);
      if (node) { node.status = 'healthy'; }
      state.metrics.nodesPendingReview = Math.max(0, state.metrics.nodesPendingReview - 1);
    },
    rejectNode(state, action: PayloadAction<string>) {
      state.nodes = state.nodes.filter(n => n.id !== action.payload);
      state.metrics.nodesPendingReview = Math.max(0, state.metrics.nodesPendingReview - 1);
    },
    updateNodeOwner(state, action: PayloadAction<{ id: string; owner: string }>) {
      const node = state.nodes.find(n => n.id === action.payload.id);
      if (node) { node.owner = action.payload.owner; }
    },
    markNodeStale(state, action: PayloadAction<string>) {
      const node = state.nodes.find(n => n.id === action.payload);
      if (node) { node.status = 'stale'; }
    },
    setActiveNode(state, action: PayloadAction<string | null>) {
      state.activeNodeId = action.payload;
    },

    // Graph filter actions
    setGraphDomains(state, action: PayloadAction<string[]>) {
      state.graphFilters.domains = action.payload;
    },
    setConfidenceThreshold(state, action: PayloadAction<number>) {
      state.graphFilters.confidenceThreshold = action.payload;
    },
    setGraphSearch(state, action: PayloadAction<string>) {
      state.graphFilters.searchQuery = action.payload;
    },

    // Skill actions
    publishSkill(state, action: PayloadAction<string>) {
      const skill = state.skills.find(s => s.id === action.payload);
      if (skill) {
        skill.status = 'published';
        skill.lastPublished = new Date().toISOString();
      }
    },
    deprecateSkill(state, action: PayloadAction<string>) {
      const skill = state.skills.find(s => s.id === action.payload);
      if (skill) { skill.status = 'deprecated'; }
    },

    // Connector actions
    syncConnector(state, action: PayloadAction<string>) {
      const conn = state.connectors.find(c => c.id === action.payload);
      if (conn) { conn.lastSync = new Date().toISOString(); }
    },
    disconnectConnector(state, action: PayloadAction<string>) {
      const conn = state.connectors.find(c => c.id === action.payload);
      if (conn) { conn.status = 'disconnected'; }
    },
    addConnector(state, action: PayloadAction<Connector>) {
      state.connectors.push(action.payload);
    },
  },
});

export const {
  approveNode, rejectNode, updateNodeOwner, markNodeStale, setActiveNode,
  setGraphDomains, setConfidenceThreshold, setGraphSearch,
  publishSkill, deprecateSkill,
  syncConnector, disconnectConnector, addConnector,
} = brainSlice.actions;

export default brainSlice.reducer;
