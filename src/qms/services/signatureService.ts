// signatureService.ts — Electronic Signature service (21 CFR Part 11)
// Manages signature generation, audit logging for e-signature events
// Business rules: signature hash generation, immutable audit trail

import { useQMSStore } from '@/qms/lib/demo-store';
import type { SignatureType } from '@/qms/types/qms';

// ============================================================================
// Signature Operations
// ============================================================================

/**
 * Generates an electronic signature hash.
 * - Combines signer ID, record ID, signature type, and timestamp
 * - Returns a deterministic hash string for audit purposes
 */
export function generateSignatureHash(
  signerId: string,
  recordId: string,
  signatureType: SignatureType | string
): string {
  const store = useQMSStore.getState();
  return store.generateSignatureHash(signerId, recordId, signatureType);
}

/**
 * Logs an electronic signature event to the audit trail.
 * - Records the signer, record, and signature type
 * - Creates an immutable audit trail entry
 */
export function logSignatureAudit(
  recordId: string,
  signatureType: SignatureType,
  recordTitle: string,
  signerId?: string,
  signerEmail?: string
): void {
  const store = useQMSStore.getState();

  store.logAudit('SIGN', 'ElectronicSignature', recordId, undefined, {
    signatureType,
    recordTitle,
    signerId,
    signerEmail,
  });
}

/**
 * Convenience function that generates a signature hash AND logs the audit event.
 * This is the primary function components should use for e-signature operations.
 */
export function performElectronicSignature(
  signerId: string,
  recordId: string,
  signatureType: SignatureType,
  recordTitle: string,
  signerEmail?: string
): { signatureHash: string; signedAt: string } {
  const signatureHash = generateSignatureHash(signerId, recordId, signatureType);

  logSignatureAudit(recordId, signatureType, recordTitle, signerId, signerEmail);

  return {
    signatureHash,
    signedAt: new Date().toISOString(),
  };
}
