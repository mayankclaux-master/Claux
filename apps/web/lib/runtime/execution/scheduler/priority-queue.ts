/**
 * CLAUX Runtime Execution Engine - Priority Queue
 * 
 * Priority queue implementation for task scheduling.
 * No external dependencies - pure priority queue implementation.
 */

import type { PriorityQueueItem } from '../types';

/**
 * Priority Queue
 * 
 * Min-heap based priority queue implementation.
 */
export class PriorityQueue<T> {
  private heap: PriorityQueueItem<T>[] = [];
  private size: number = 0;

  /**
   * Add item to queue
   */
  enqueue(item: T, priority: number): void {
    const queueItem: PriorityQueueItem<T> = {
      item,
      priority,
      timestamp: new Date(),
    };

    this.heap.push(queueItem);
    this.size++;
    this.bubbleUp(this.size - 1);
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): PriorityQueueItem<T> | undefined {
    if (this.size === 0) {
      return undefined;
    }

    const root = this.heap[0];
    const last = this.heap.pop()!;

    this.size--;

    if (this.size > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return root;
  }

  /**
   * Peek at highest priority item without removing
   */
  peek(): PriorityQueueItem<T> | undefined {
    return this.heap[0];
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.heap = [];
    this.size = 0;
  }

  /**
   * Get all items in priority order
   */
  toArray(): readonly PriorityQueueItem<T>[] {
    const copy = [...this.heap];
    const result: PriorityQueueItem<T>[] = [];

    while (copy.length > 0) {
      result.push(copy[0]);
      const last = copy.pop()!;
      if (copy.length > 0) {
        copy[0] = last;
        this.bubbleDownArray(0, copy);
      }
    }

    return result;
  }

  /**
   * Remove item by predicate
   */
  remove(predicate: (item: T) => boolean): boolean {
    for (let i = 0; i < this.heap.length; i++) {
      if (predicate(this.heap[i].item)) {
        // Remove by swapping with last and bubbling
        const last = this.heap.pop()!;
        this.size--;

        if (i < this.heap.length) {
          this.heap[i] = last;
          this.bubbleUp(i);
          this.bubbleDown(i);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Update priority of an item
   * Removes and re-adds the item with new priority
   */
  updatePriority(item: T, newPriority: number): boolean {
    for (let i = 0; i < this.heap.length; i++) {
      if (this.heap[i].item === item) {
        // Remove the item
        const last = this.heap.pop()!;
        this.size--;

        if (i < this.heap.length) {
          this.heap[i] = last;
          this.bubbleUp(i);
          this.bubbleDown(i);
        }

        // Re-add with new priority
        this.enqueue(item, newPriority);
        return true;
      }
    }

    return false;
  }

  /**
   * Bubble up to maintain heap property
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) {
        break;
      }

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  /**
   * Bubble down to maintain heap property
   */
  private bubbleDown(index: number): void {
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestChildIndex = index;

      if (leftChildIndex < this.size &&
          this.compare(this.heap[leftChildIndex], this.heap[smallestChildIndex]) < 0) {
        smallestChildIndex = leftChildIndex;
      }

      if (rightChildIndex < this.size &&
          this.compare(this.heap[rightChildIndex], this.heap[smallestChildIndex]) < 0) {
        smallestChildIndex = rightChildIndex;
      }

      if (smallestChildIndex === index) {
        break;
      }

      this.swap(index, smallestChildIndex);
      index = smallestChildIndex;
    }
  }

  /**
   * Bubble down for array copy
   */
  private bubbleDownArray(index: number, array: PriorityQueueItem<T>[]): void {
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestChildIndex = index;

      if (leftChildIndex < array.length &&
          this.compare(array[leftChildIndex], array[smallestChildIndex]) < 0) {
        smallestChildIndex = leftChildIndex;
      }

      if (rightChildIndex < array.length &&
          this.compare(array[rightChildIndex], array[smallestChildIndex]) < 0) {
        smallestChildIndex = rightChildIndex;
      }

      if (smallestChildIndex === index) {
        break;
      }

      this.swapArray(index, smallestChildIndex, array);
      index = smallestChildIndex;
    }
  }

  /**
   * Compare two queue items
   * Returns negative if a < b, 0 if equal, positive if a > b
   */
  private compare(a: PriorityQueueItem<T>, b: PriorityQueueItem<T>): number {
    // Higher priority (lower number) comes first
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // If priorities are equal, use timestamp (FIFO)
    return a.timestamp.getTime() - b.timestamp.getTime();
  }

  /**
   * Swap two elements in heap
   */
  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Swap two elements in array
   */
  private swapArray(i: number, j: number, array: PriorityQueueItem<T>[]): void {
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
