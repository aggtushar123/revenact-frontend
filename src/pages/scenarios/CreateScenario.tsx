import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  addEdge, 
  Background, 
  BackgroundVariant,
  useNodesState, 
  useEdgesState, 
  Panel,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EntryNode, OperatorNode, ActionNode } from './CustomNodes';
import { CustomEdge } from './CustomEdge';
import { BuilderSidebar } from './BuilderSidebar';
import { ScenarioHeader } from './ScenarioHeader';
import { EditNodePane } from './EditNodePane';
import type { ScenarioNodeDetail, ScenarioNodeData } from './types';

const nodeTypes = {
  entry: EntryNode,
  operator: OperatorNode,
  action: ActionNode,
};

const edgeTypes = {
  interactive: CustomEdge,
};

const initialNodes: Node<ScenarioNodeData>[] = [];
const initialEdges: Edge[] = [];

let idIncrement = 10;
const getId = () => `node_${idIncrement++}`;

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Let type inference handle the generic if possible, or use Node<ScenarioNodeData>
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ScenarioNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        
        <Panel position="top-right" className="bg-white border border-gray-200 shadow-sm rounded-lg p-1 flex gap-0.5 mr-6 mt-4 overflow-hidden">
           <button 
             onClick={() => zoomIn()}
             className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded transition-all text-gray-500 hover:text-gray-900"
             title="Zoom In"
           >
             <span className="text-xl font-medium">+</span>
           </button>
           <button 
             onClick={() => zoomOut()}
             className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded transition-all text-gray-500 hover:text-gray-900"
             title="Zoom Out"
           >
             <span className="text-xl font-medium">−</span>
           </button>
           
           <div className="w-px bg-gray-100 h-4 my-auto mx-1" />
           
           <button 
             onClick={() => fitView({ duration: 400 })}
             className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded transition-all text-gray-400 hover:text-gray-900"
             title="Fit to Screen"
           >
             <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87-2.3 2.3V21z"/></svg>
           </button>
           
           <button 
             onClick={() => setIsLocked(!isLocked)}
             className={`w-8 h-8 flex items-center justify-center rounded transition-all ${isLocked ? 'bg-orange-50 text-orange-500 shadow-inner' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-900'}`}
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
        onSave={() => setEditingNode(null)} 
      />
    </div>
  );
}

export function CreateScenario() {
  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] overflow-hidden">
      <ScenarioHeader />
      
      <div className="flex-1 flex overflow-hidden">
        <BuilderSidebar />
        
        <div className="flex-1 overflow-hidden relative">
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
