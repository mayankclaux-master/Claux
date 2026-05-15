/**
 * CLAUX Runtime Security Layer - Facade
 */

import { PermissionManager } from './permissions';
import { AuthorizationManager } from './authorization';
import { SecureContextManager } from './secure-context';
import { SecretAccessManager } from './secret-access';
import { EncryptionSemanticsManager } from './encryption-semantics';
import { SigningSemanticsManager } from './signing-semantics';
import { TrustBoundaryManager } from './trust-boundaries';
import { IdentityVerificationManager } from './identity-verification';
import { SecureReplayManager } from './secure-replay';

/**
 * Security Facade
 */
export class SecurityFacade {
  readonly permissions: PermissionManager;
  readonly authorization: AuthorizationManager;
  readonly context: SecureContextManager;
  readonly secrets: SecretAccessManager;
  readonly encryption: EncryptionSemanticsManager;
  readonly signing: SigningSemanticsManager;
  readonly trustBoundaries: TrustBoundaryManager;
  readonly identity: IdentityVerificationManager;
  readonly replay: SecureReplayManager;

  constructor() {
    this.permissions = new PermissionManager();
    this.authorization = new AuthorizationManager();
    this.context = new SecureContextManager();
    this.secrets = new SecretAccessManager();
    this.encryption = new EncryptionSemanticsManager();
    this.signing = new SigningSemanticsManager();
    this.trustBoundaries = new TrustBoundaryManager();
    this.identity = new IdentityVerificationManager();
    this.replay = new SecureReplayManager();
  }
}
