import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ReactFlow,
  addEdge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { Connection, Edge, Node, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EntryNode, OperatorNode, ActionNode } from './CustomNodes';
import { CustomEdge } from './CustomEdge';
import { BuilderSidebar } from './BuilderSidebar';
import { ScenarioHeader } from './ScenarioHeader';
import { EditNodePane } from './EditNodePane';
import { getScenario, upsertScenario } from './scenarioStorage';
import type { ScenarioNodeDetail, ScenarioNodeData, ApplyToTarget } from './types';

// Scenarios have no backend at all — no Scenario model, no automation
// engine, nothing in revenact-backend. Every per-node-type edit panel
// (Filter/Condition/Assign Playbook/Create Pipeline/Slack Message —
// see EditNodePane.tsx) is still an illustrative mockup for the same
// reason: there's no real Playbook/Slack/email-integration/attribute-
// picker concept to select from yet. What *is* real: the canvas itself
// (drag/connect/delete nodes and edges — see CustomNodes.tsx/
// CustomEdge.tsx, already fully wired via useReactFlow), node label
// editing, and the scenario as a whole (name/applyTo/graph) round-
// tripping through localStorage — see scenarioStorage.ts — so building
// a flow, saving it, leaving, and reopening it genuinely works end to
// end for one browser, even with no server behind any of it.

const nodeTypes = {
  entry: EntryNode,
  operator: OperatorNode,
  action: ActionNode,
};

const edgeTypes = {
  interactive: CustomEdge,
};

let idIncrement = 10;
const getId = () => `node_${idIncrement++}`;

// No Web Crypto dependency (randomUUID isn't guaranteed in every test
// environment) — good enough for a client-only id nothing else needs
// to be globally unique against.
function generateScenarioId(): string {
  return `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface FlowProps {
  nodes: Node<ScenarioNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<ScenarioNodeData>>;
  onEdgesChange: OnEdgesChange<Edge>;
  setNodes: React.Dispatch<React.SetStateAction<Node<ScenarioNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

function Flow({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges }: FlowProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [editingNode, setEditingNode] = useState<ScenarioNodeDetail | null>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  // Listen for edit events from custom nodes
  useEffect(() => {
    const handleEdit = (event: Event) => {
      const customEvent = event as CustomEvent<ScenarioNodeDetail>;
      if (customEvent.detail) {
        setEditingNode(customEvent.detail);
      }
    };
    window.addEventListener('edit-node', handleEdit);
    return () => window.removeEventListener('edit-node', handleEdit);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'interactive' }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow/label');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<ScenarioNodeData> = {
        id: getId(),
        type,
        position,
        data: { label: `New ${label}`, action: label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  // Merges the pane's own saved fields onto the node's existing data
  // (see EditNodePane's own docstring on which fields those are)
  // rather than replacing it wholesale — anything the pane doesn't
  // collect (e.g. `action`, set once at creation) survives untouched.
  const handleSaveNode = (updates: Partial<ScenarioNodeData>) => {
    if (!editingNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === editingNode.id ? { ...n, data: { ...n.data, ...updates } } : n))
    );
    setEditingNode(null);
  };

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-strong)" />

        <Panel position="top-right" className="bg-surface border border-line shadow-sm rounded-lg p-1 flex gap-0.5 mr-6 mt-4 overflow-hidden">
           <button
             onClick={() => zoomIn()}
             className="w-8 h-8 flex items-center justify-center hover:bg-subtle rounded transition-all text-ink-muted hover:text-ink"
             title="Zoom In"
           >
             <span className="text-xl font-medium">+</span>
           </button>
           <button
             onClick={() => zoomOut()}
             className="w-8 h-8 flex items-center justify-center hover:bg-subtle rounded transition-all text-ink-muted hover:text-ink"
             title="Zoom Out"
           >
             <span className="text-xl font-medium">−</span>
           </button>

           <div className="w-px bg-subtle h-4 my-auto mx-1" />

           <button
             onClick={() => fitView({ duration: 400 })}
             className="w-8 h-8 flex items-center justify-center hover:bg-subtle rounded transition-all text-ink-faint hover:text-ink"
             title="Fit to Screen"
           >
             <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87-2.3 2.3V21z"/></svg>
           </button>

           <button
             onClick={() => setIsLocked(!isLocked)}
             className={`w-8 h-8 flex items-center justify-center rounded transition-all ${isLocked ? 'bg-warning-dim text-warning shadow-inner' : 'hover:bg-subtle text-ink-faint hover:text-ink'}`}
             title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
           >
             {isLocked ? (
               <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5px]"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
             ) : (
               <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5px]"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 019.9-1"></path></svg>
             )}
           </button>
        </Panel>
      </ReactFlow>

      {/* Edit Pane */}
      <EditNodePane
        isOpen={!!editingNode}
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
      />
    </div>
  );
}

export function CreateScenario() {
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [scenarioId] = useState(() => routeId ?? generateScenarioId());
  const [name, setName] = useState('Untitled Scenario');
  const [applyTo, setApplyTo] = useState<ApplyToTarget>('Organizations');
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ScenarioNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Loads the existing scenario, if any — a fresh /scenarios/create
  // visit has no routeId, so this is a no-op and the state above's own
  // defaults (blank graph, "Untitled Scenario") stand. Runs once: a
  // real navigation to a *different* scenario remounts this page
  // entirely (the route param is part of React Router's own key), so
  // there's no "routeId changed under us" case to react to.
  useEffect(() => {
    if (!routeId) return;
    const existing = getScenario(routeId);
    if (!existing) return;
    setName(existing.name);
    setApplyTo(existing.applyTo);
    setNodes(existing.nodes);
    setEdges(existing.edges);
    setCreatedAt(existing.createdAt);
    setLastSavedAt(existing.updatedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist() {
    const now = new Date().toISOString();
    upsertScenario({
      id: scenarioId,
      name: name.trim() || 'Untitled Scenario',
      applyTo,
      nodes,
      edges,
      createdAt,
      updatedAt: now,
    });
    setLastSavedAt(now);
  }

  function handleSaveAndClose() {
    persist();
    navigate('/scenarios');
  }

  return (
    <div className="w-full h-full flex flex-col bg-base overflow-hidden">
      <ScenarioHeader
        name={name}
        onNameChange={setName}
        applyTo={applyTo}
        onApplyToChange={setApplyTo}
        onSave={persist}
        onSaveAndClose={handleSaveAndClose}
        lastSavedAt={lastSavedAt}
      />

      <div className="flex-1 flex overflow-hidden">
        <BuilderSidebar />

        <div className="flex-1 overflow-hidden relative">
          <ReactFlowProvider>
            <Flow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setNodes={setNodes}
              setEdges={setEdges}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
