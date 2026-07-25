import { describe, it, expect } from 'vitest';
import reducer, {
  approveNode,
  rejectNode,
  markNodeStale,
  updateNodeOwner,
  setGraphSearch,
  setConfidenceThreshold,
  publishSkill,
  deprecateSkill,
  disconnectConnector,
} from './brainSlice';

const init = () => reducer(undefined, { type: '@@INIT' });

describe('brainSlice', () => {
  describe('knowledge nodes', () => {
    it('approveNode marks the node healthy and decrements pending-review count', () => {
      const initial = init();
      const pending = initial.nodes.find((n) => n.status === 'pending' || n.status === 'new');
      expect(pending).toBeDefined();

      const next = reducer(initial, approveNode(pending!.id));
      expect(next.nodes.find((n) => n.id === pending!.id)?.status).toBe('healthy');
      expect(next.metrics.nodesPendingReview).toBe(initial.metrics.nodesPendingReview - 1);
    });

    it('rejectNode removes the node entirely', () => {
      const initial = init();
      const target = initial.nodes[0];
      const next = reducer(initial, rejectNode(target.id));

      expect(next.nodes.find((n) => n.id === target.id)).toBeUndefined();
      expect(next.nodes.length).toBe(initial.nodes.length - 1);
    });

    it('nodesPendingReview never goes below zero', () => {
      let state = init();
      for (let i = 0; i < state.metrics.nodesPendingReview + 5; i++) {
        state = reducer(state, approveNode('nonexistent-node'));
      }
      expect(state.metrics.nodesPendingReview).toBe(0);
    });

    it('markNodeStale and updateNodeOwner mutate only the targeted node', () => {
      const initial = init();
      const [first, second] = initial.nodes;

      let next = reducer(initial, markNodeStale(first.id));
      next = reducer(next, updateNodeOwner({ id: second.id, owner: 'Priya Sharma' }));

      expect(next.nodes.find((n) => n.id === first.id)?.status).toBe('stale');
      expect(next.nodes.find((n) => n.id === second.id)?.owner).toBe('Priya Sharma');
      expect(next.nodes.find((n) => n.id === second.id)?.status).toBe(second.status);
    });
  });

  describe('graph filters', () => {
    it('updates search query and confidence threshold independently', () => {
      let state = init();
      state = reducer(state, setGraphSearch('pricing'));
      state = reducer(state, setConfidenceThreshold(0.8));

      expect(state.graphFilters.searchQuery).toBe('pricing');
      expect(state.graphFilters.confidenceThreshold).toBe(0.8);
      expect(state.graphFilters.domains).toEqual([]);
    });
  });

  describe('skills', () => {
    it('publishSkill sets status and stamps lastPublished', () => {
      const initial = init();
      const draft = initial.skills.find((s) => s.status !== 'published');
      expect(draft).toBeDefined();

      const next = reducer(initial, publishSkill(draft!.id));
      const published = next.skills.find((s) => s.id === draft!.id)!;
      expect(published.status).toBe('published');
      expect(published.lastPublished).toBeDefined();
    });

    it('deprecateSkill sets status to deprecated', () => {
      const initial = init();
      const target = initial.skills[0];
      const next = reducer(initial, deprecateSkill(target.id));
      expect(next.skills.find((s) => s.id === target.id)?.status).toBe('deprecated');
    });
  });

  describe('connectors', () => {
    it('disconnectConnector flips status without touching other connectors', () => {
      const initial = init();
      const connected = initial.connectors.find((c) => c.status === 'connected');
      expect(connected).toBeDefined();

      const next = reducer(initial, disconnectConnector(connected!.id));
      expect(next.connectors.find((c) => c.id === connected!.id)?.status).toBe('disconnected');

      const others = next.connectors.filter((c) => c.id !== connected!.id);
      const before = initial.connectors.filter((c) => c.id !== connected!.id);
      expect(others.map((c) => c.status)).toEqual(before.map((c) => c.status));
    });
  });
});
