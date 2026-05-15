/**
 * CLAUX Runtime SDK Layer - Session Semantics
 */

import type { Session, SessionId } from './types';
import { DEFAULT_SESSION_TTL } from './constants';

/**
 * Session Semantics Manager
 */
export class SessionSemanticsManager {
  private sessions: Map<SessionId, Session> = new Map();

  /**
   * Create session
   */
  create(tenantId?: string): Session {
    const sessionId = this.generateSessionId();
    const session: Session = {
      sessionId,
      createdAt: Date.now(),
      tenantId,
      metadata: {},
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Validate session
   */
  validate(sessionId: SessionId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const age = Date.now() - session.createdAt;
    return age < DEFAULT_SESSION_TTL;
  }

  /**
   * Destroy session
   */
  destroy(sessionId: SessionId): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): SessionId {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
