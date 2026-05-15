/**
 * CLAUX Runtime SDK Layer - Reactive Streams
 */

import type { Stream, StreamId } from './types';
import { DEFAULT_STREAM_BUFFER_SIZE } from './constants';

/**
 * Reactive Stream Manager
 */
export class ReactiveStreamManager {
  private streams: Map<StreamId, Stream> = new Map();
  private buffers: Map<StreamId, unknown[]> = new Map();

  /**
   * Create stream
   */
  create(type: Stream['type']): Stream {
    const streamId = this.generateStreamId();
    const stream: Stream = {
      streamId,
      type,
      active: true,
    };

    this.streams.set(streamId, stream);
    this.buffers.set(streamId, []);
    return stream;
  }

  /**
   * Push to stream
   */
  push(streamId: StreamId, data: unknown): void {
    const buffer = this.buffers.get(streamId);
    if (!buffer) return;

    buffer.push(data);
    if (buffer.length > DEFAULT_STREAM_BUFFER_SIZE) {
      buffer.shift();
    }
  }

  /**
   * Pull from stream
   */
  pull(streamId: StreamId): readonly unknown[] {
    return this.buffers.get(streamId) || [];
  }

  /**
   * Close stream
   */
  close(streamId: StreamId): void {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    const updated: Stream = {
      ...stream,
      active: false,
    };

    this.streams.set(streamId, updated);
  }

  /**
   * Clear
   */
  clear(): void {
    this.streams.clear();
    this.buffers.clear();
  }

  /**
   * Generate stream ID
   */
  private generateStreamId(): StreamId {
    return `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
