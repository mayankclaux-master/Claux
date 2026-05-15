/**
 * CLAUX Runtime SDK Layer - Validation
 */

import type { Session, Subscription } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * SDK Validator
 */
export class SDKValidator {
  /**
   * Validate session
   */
  validateSession(session: Session): ValidationResult {
    const errors: string[] = [];

    if (!session.sessionId) errors.push('Missing sessionId');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate subscription
   */
  validateSubscription(subscription: Subscription): ValidationResult {
    const errors: string[] = [];

    if (!subscription.subscriptionId) errors.push('Missing subscriptionId');
    if (!subscription.topic) errors.push('Missing topic');

    return { valid: errors.length === 0, errors };
  }
}
