import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, NavLink } from 'react-router-dom';
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
import { ChevronLeft } from 'lucide-react';

import { ContactNode } from './ContactNode';
import { CanvasEdge } from './CanvasEdge';
import { CanvasSidebar } from './CanvasSidebar';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchCanvasById,
  createCanvas,
  updateCanvas,
  fetchContactsForCustomer,
  fetchContactsForAccount,
} from '../../features/customers/customersSlice';
import { formatRelativeTime } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';

// Mirrors CreateScenario.tsx's own Flow/CreateScenario split closely —
// same load-by-route-param / useNodesState+useEdgesState / drag-to-add
// / POST-then-swap-URL-to-PATCH persistence / zoom+fit+lock toolbar.
// The one real difference: a Canvas always has a real parent (Customer
// or Account) from the moment it's created — Scenario has none — so
// the parent's id travels via the `/canvas/create?customerId=...`
// route's own query params until the first save gives this a real id
// of its own to load by instead.

const nodeTypes = { contact: ContactNode };
const edgeTypes = { relationship: CanvasEdge };

let idIncrement = 10;
const getId = () => `node_${idIncrement++}`;

interface FlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

function Flow({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges }: FlowProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'relationship' }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const contactIdRaw = event.dataTransfer.getData('application/reactflow/contact-id');
      if (type !== 'contact' || !contactIdRaw) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode: Node = {
        id: getId(),
        type: 'contact',
        position,
        data: { contact_id: Number(contactIdRaw) },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-strong)" />

        <Panel
          position="top-right"
          className="bg-surface border border-line shadow-sm rounded-lg p-1 flex gap-0.5 mr-6 mt-4 overflow-hidden"
        >
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
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87-2.3 2.3V21z" />
            </svg>
          </button>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`w-8 h-8 flex items-center justify-center rounded transition-all ${isLocked ? 'bg-warning-dim text-warning shadow-inner' : 'hover:bg-subtle text-ink-faint hover:text-ink'}`}
            title={isLocked ? 'Unlock Canvas' : 'Lock Canvas'}
          >
            {isLocked ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5px]">
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5px]">
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 019.9-1" />
              </svg>
            )}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function CanvasEditor() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const contacts = useAppSelector((state) => state.customers.contacts);

  // undefined until the first successful save — persist() below POSTs
  // while this is undefined and PATCHes once it's a real id, same
  // convention as CreateScenario.tsx's own scenarioId.
  const [canvasId, setCanvasId] = useState<number | undefined>(routeId ? Number(routeId) : undefined);
  const [name, setName] = useState('Untitled Canvas');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!routeId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The parent Customer/Account this Canvas belongs to — known up
  // front from the `?customerId=...` query param on a brand new
  // Canvas, or resolved from the loaded Canvas's own `companies`/
  // `account_id` once fetched.
  const [customerId, setCustomerId] = useState<number | undefined>(
    searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined
  );
  const [accountId, setAccountId] = useState<number | undefined>(
    searchParams.get('accountId') ? Number(searchParams.get('accountId')) : undefined
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Loads the existing canvas, if any — a fresh /canvas/create visit
  // has no routeId, so this is a no-op and the query-param-derived
  // parent + blank graph above stand. Runs once, same "route changes
  // remount this page entirely" reasoning as CreateScenario.tsx's own.
  useEffect(() => {
    if (!routeId) return;

    async function load() {
      try {
        const existing = await dispatch(fetchCanvasById(Number(routeId))).unwrap();
        setName(existing.name);
        setNodes(existing.nodes);
        setEdges(existing.edges);
        setLastSavedAt(existing.updated_at);
        setCustomerId(existing.companies[0]?.id);
        setAccountId(existing.account_id ?? undefined);
      } catch (err) {
        setLoadError(
          typeof err === 'string' ? err : err instanceof ApiError ? err.message : 'Could not load this canvas.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetches the parent company's real Contacts so nodes can resolve
  // their `contact_id` to a live name/role/sentiment, and so
  // CanvasSidebar has a real palette to drag from.
  useEffect(() => {
    if (customerId === undefined) return;
    if (accountId !== undefined) {
      dispatch(fetchContactsForAccount({ customerId, accountId }));
    } else {
      dispatch(fetchContactsForCustomer(customerId));
    }
  }, [dispatch, customerId, accountId]);

  async function persist() {
    setSaveError(null);
    try {
      if (canvasId) {
        const saved = await dispatch(updateCanvas({ id: canvasId, name: name.trim() || 'Untitled Canvas', nodes, edges })).unwrap();
        setLastSavedAt(saved.updated_at);
      } else {
        const saved = await dispatch(
          createCanvas({ customerId, accountId, name: name.trim() || 'Untitled Canvas', nodes, edges })
        ).unwrap();
        setCanvasId(saved.id);
        // Swaps /canvas/create for /canvas/<id> without a remount
        // (`replace` — no "back" stop on the create URL) so a further
        // Save PATCHes this same row instead of creating a duplicate.
        navigate(`/canvas/${saved.id}`, { replace: true });
        setLastSavedAt(saved.updated_at);
      }
    } catch (err) {
      setSaveError(typeof err === 'string' ? err : 'Could not save this canvas.');
    }
  }

  async function handleSaveAndClose() {
    await persist();
    navigate('/canvas');
  }

  const placedContactIds = new Set(nodes.map((n) => (n.data as { contact_id: number }).contact_id));

  if (!routeId && customerId === undefined) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base text-[13px] text-danger">
        No company was chosen for this canvas — go back and pick one.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base text-[13px] text-ink-faint">
        Loading…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base text-[13px] text-danger">
        {loadError}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-base overflow-hidden">
      <header className="h-[64px] border-b border-line-subtle bg-surface flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-6">
          <NavLink to="/canvas" className="flex items-center text-ink-faint hover:text-ink transition-colors">
            <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
          </NavLink>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Canvas"
            aria-label="Canvas name"
            className="text-[17px] font-bold text-ink tracking-tight bg-transparent border border-transparent hover:border-line focus:border-accent rounded-md px-2 py-1 -ml-2 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-w-[180px]"
          />
        </div>

        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="text-[12px] text-ink-faint font-medium">Saved {formatRelativeTime(lastSavedAt)}</span>
          )}
          <button
            onClick={persist}
            className="bg-accent hover:bg-accent-hover text-on-accent px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm"
          >
            Save
          </button>
          <button
            onClick={handleSaveAndClose}
            className="bg-surface border border-accent text-accent hover:bg-accent-dim px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm"
          >
            Save & Close
          </button>
        </div>
      </header>

      {saveError && (
        <div className="px-6 py-2 bg-danger-dim border-b border-danger/30 text-[12.5px] text-danger shrink-0">
          {saveError}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <CanvasSidebar contacts={contacts} placedContactIds={placedContactIds} />

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
