export type ScenarioNodeData = {
  action: string;
  label: string;
};

export type ScenarioNodeType = 'entry' | 'operator' | 'action';

export interface ScenarioNodeDetail {
  id: string;
  data: ScenarioNodeData;
  type: ScenarioNodeType;
}
