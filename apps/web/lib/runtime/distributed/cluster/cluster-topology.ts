/**
 * CLAUX Runtime Distributed Layer - Cluster Topology
 * 
 * Manages cluster topology and network structure.
 * No external dependencies - pure topology semantics.
 */

import type { WorkerId, ClusterId, ClusterTopology, ClusterNode, ClusterEdge } from '../types';

/**
 * Cluster Topology Manager
 * 
 * Manages cluster topology and network structure.
 */
export class ClusterTopologyManager {
  private topology: ClusterTopology;
  private clusterId: ClusterId;

  constructor(clusterId: ClusterId) {
    this.clusterId = clusterId;
    this.topology = {
      nodes: [],
      edges: [],
    };
  }

  /**
   * Add node to topology
   */
  addNode(node: ClusterNode): void {
    if (this.topology.nodes.some(n => n.workerId === node.workerId)) {
      throw new Error(`Node ${node.workerId} already exists in topology`);
    }

    this.topology = {
      ...this.topology,
      nodes: [...this.topology.nodes, node],
    };
  }

  /**
   * Remove node from topology
   */
  removeNode(workerId: WorkerId): void {
    const filteredNodes = this.topology.nodes.filter(n => n.workerId !== workerId);
    
    // Remove edges connected to this node
    const filteredEdges = this.topology.edges.filter(
      e => e.from !== workerId && e.to !== workerId
    );

    this.topology = {
      ...this.topology,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }

  /**
   * Add edge to topology
   */
  addEdge(edge: ClusterEdge): void {
    if (this.topology.edges.some(e => e.from === edge.from && e.to === edge.to)) {
      throw new Error(`Edge ${edge.from} -> ${edge.to} already exists`);
    }

    this.topology = {
      ...this.topology,
      edges: [...this.topology.edges, edge],
    };
  }

  /**
   * Remove edge from topology
   */
  removeEdge(from: WorkerId, to: WorkerId): void {
    this.topology = {
      ...this.topology,
      edges: this.topology.edges.filter(
        e => !(e.from === from && e.to === to)
      ),
    };
  }

  /**
   * Get topology
   */
  getTopology(): ClusterTopology {
    return {
      nodes: [...this.topology.nodes],
      edges: [...this.topology.edges],
    };
  }

  /**
   * Get node
   */
  getNode(workerId: WorkerId): ClusterNode | undefined {
    return this.topology.nodes.find(n => n.workerId === workerId);
  }

  /**
   * Get all nodes
   */
  getNodes(): readonly ClusterNode[] {
    return [...this.topology.nodes];
  }

  /**
   * Get all edges
   */
  getEdges(): readonly ClusterEdge[] {
    return [...this.topology.edges];
  }

  /**
   * Get neighbors of node
   */
  getNeighbors(workerId: WorkerId): readonly WorkerId[] {
    const neighbors: WorkerId[] = [];
    
    for (const edge of this.topology.edges) {
      if (edge.from === workerId) {
        neighbors.push(edge.to);
      } else if (edge.to === workerId) {
        neighbors.push(edge.from);
      }
    }

    return neighbors;
  }

  /**
   * Get node degree
   */
  getNodeDegree(workerId: WorkerId): number {
    return this.getNeighbors(workerId).length;
  }

  /**
   * Check if nodes are connected
   */
  areConnected(from: WorkerId, to: WorkerId): boolean {
    return this.topology.edges.some(
      e => (e.from === from && e.to === to) ||
           (e.from === to && e.to === from)
    );
  }

  /**
   * Get shortest path between nodes (BFS)
   */
  getShortestPath(source: WorkerId, target: WorkerId): WorkerId[] | undefined {
    if (source === target) {
      return [source];
    }

    const visited = new Set<WorkerId>();
    const queue: { workerId: WorkerId; path: WorkerId[] }[] = [{ workerId: source, path: [source] }];

    while (queue.length > 0) {
      const { workerId, path } = queue.shift()!;

      if (workerId === target) {
        return path;
      }

      if (visited.has(workerId)) {
        continue;
      }

      visited.add(workerId);

      for (const neighbor of this.getNeighbors(workerId)) {
        if (!visited.has(neighbor)) {
          queue.push({ workerId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return undefined;
  }

  /**
   * Get topology statistics
   */
  getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    averageDegree: number;
    maxDegree: number;
    minDegree: number;
    connectedComponents: number;
  } {
    const nodeCount = this.topology.nodes.length;
    const edgeCount = this.topology.edges.length;

    const degrees = this.topology.nodes.map(n => this.getNodeDegree(n.workerId));
    const avgDegree = nodeCount > 0 ? degrees.reduce((sum, d) => sum + d, 0) / nodeCount : 0;
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;
    const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;

    const connectedComponents = this.countConnectedComponents();

    return {
      nodeCount,
      edgeCount,
      averageDegree: avgDegree,
      maxDegree,
      minDegree,
      connectedComponents,
    };
  }

  /**
   * Count connected components using BFS
   */
  private countConnectedComponents(): number {
    const visited = new Set<WorkerId>();
    let components = 0;

    for (const node of this.topology.nodes) {
      if (!visited.has(node.workerId)) {
        this.bfsVisit(node.workerId, visited);
        components++;
      }
    }

    return components;
  }

  /**
   * BFS visit for connected components
   */
  private bfsVisit(startWorkerId: WorkerId, visited: Set<WorkerId>): void {
    const queue: WorkerId[] = [startWorkerId];
    visited.add(startWorkerId);

    while (queue.length > 0) {
      const workerId = queue.shift()!;
      
      for (const neighbor of this.getNeighbors(workerId)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  /**
   * Clear topology
   */
  clear(): void {
    this.topology = {
      nodes: [],
      edges: [],
    };
  }
}
