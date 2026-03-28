import type { Node } from '@xyflow/react';

export interface ScenarioNodeData {
  label: string;
  action: string;
  [key: string]: any; // Allow for extensibility while maintaining a base structure
}

export type ScenarioNode = Node<ScenarioNodeData>;

export interface EditNodeDetail {
  id: string;
  data: ScenarioNodeData;
  type: 'entry' | 'operator' | 'action';
}

export type EditNodeEvent = CustomEvent<EditNodeDetail>;
