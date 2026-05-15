/**
 * CLAUX Runtime SDK Layer - Facade
 */

import { RuntimeClientManager } from './runtime-client';
import { StreamingClientManager } from './streaming-client';
import { RemoteExecutionManager } from './remote-execution';
import { SessionSemanticsManager } from './session-semantics';
import { SubscriptionSemanticsManager } from './subscription-semantics';
import { ReactiveStreamManager } from './reactive-streams';

/**
 * SDK Facade
 */
export class SDKFacade {
  readonly runtimeClient: RuntimeClientManager;
  readonly streamingClient: StreamingClientManager;
  readonly remoteExecution: RemoteExecutionManager;
  readonly session: SessionSemanticsManager;
  readonly subscription: SubscriptionSemanticsManager;
  readonly streams: ReactiveStreamManager;

  constructor() {
    this.runtimeClient = new RuntimeClientManager();
    this.streamingClient = new StreamingClientManager();
    this.remoteExecution = new RemoteExecutionManager();
    this.session = new SessionSemanticsManager();
    this.subscription = new SubscriptionSemanticsManager();
    this.streams = new ReactiveStreamManager();
  }
}
