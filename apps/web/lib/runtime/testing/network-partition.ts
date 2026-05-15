/**
 * CLAUX Runtime Testing Layer - Network Partition
 */

/**
 * Network Partition Manager
 */
export class NetworkPartitionManager {
  private partitions: Map<string, Set<string>> = new Map();

  /**
   * Create partition
   */
  createPartition(partitionId: string, nodes: string[]): void {
    this.partitions.set(partitionId, new Set(nodes));
  }

  /**
   * Add node to partition
   */
  addNode(partitionId: string, nodeId: string): void {
    const partition = this.partitions.get(partitionId);
    if (!partition) return;
    partition.add(nodeId);
  }

  /**
   * Remove node from partition
   */
  removeNode(partitionId: string, nodeId: string): void {
    const partition = this.partitions.get(partitionId);
    if (!partition) return;
    partition.delete(nodeId);
  }

  /**
   * Can communicate
   */
  canCommunicate(nodeA: string, nodeB: string): boolean {
    for (const partition of this.partitions.values()) {
      const aInPartition = partition.has(nodeA);
      const bInPartition = partition.has(nodeB);

      if (aInPartition !== bInPartition) {
        return false;
      }
    }
    return true;
  }

  /**
   * Clear
   */
  clear(): void {
    this.partitions.clear();
  }
}
