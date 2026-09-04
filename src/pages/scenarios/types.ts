import type { Node, Edge } from '@xyflow/react';

// A node's own saved configuration — deliberately small: only the
// handful of EditNodePane fields that are actually wired to real state
// today (label, and Send Email/On Event's own selects) get persisted.
// Every other per-node-type panel (Filter/Condition/Assign Playbook/
// Create Pipeline/Slack Message) is still an illustrative mockup with
// nothing real to select from yet (no Playbook/Slack/email-integration
// concept exists anywhere in this codebase) — see EditNodePane's own
// docstring.
export type ScenarioNodeData = {
  action: string;
  label: string;
  emailService?: string;
  eventTrigger?: string;
  orgEnters?: string;
};

export type ScenarioNodeType = 'entry' | 'operator' | 'action';

export interface ScenarioNodeDetail {
  id: string;
  data: ScenarioNodeData;
  type: ScenarioNodeType;
}

export type ApplyToTarget = 'Organizations' | 'Accounts' | 'Contacts';

// A whole scenario — see scenarioStorage.ts for why this is persisted
// to localStorage rather than a real backend (there's no Scenario
// model anywhere in revenact-backend).
export interface Scenario {
  id: string;
  name: string;
  applyTo: ApplyToTarget;
  nodes: Node<ScenarioNodeData>[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}
