import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSignatureHash,
  generateSignatureHashSync,
  verifySignatureHash,
  createSignatureRecord,
  isRecordSigned,
  isRecordLocked,
  enforceRecordNotLocked,
} from '@/services/compliance/signatureEngine';
import { useQMSStore } from '@/lib/demo-store';
import { ComplianceError, COMPLIANCE_CODES } from '@/lib/errors';
import type { SignatureType } from '@/types/qms';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultParams = {
  userId: 'user-001',
  recordId: 'rec-001',
  timestamp: '2024-06-15T12:00:00.000Z',
  passwordConfirmation: 'secure-password-123',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SignatureEngine', () => {
  beforeEach(() => {
    // Reset store to clean state
    useQMSStore.setState({
      documents: [],
      batchRecords: [],
      formInstances: [],
      auditTrails: [],
    });
  });

  // =========================================================================
  // generateSignatureHash (async)
  // =========================================================================
  describe('generateSignatureHash', () => {
    it('produces a deterministic hash for the same inputs', async () => {
      const hash1 = await generateSignatureHash(defaultParams);
      const hash2 = await generateSignatureHash(defaultParams);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await generateSignatureHash(defaultParams);
      const hash2 = await generateSignatureHash({
        ...defaultParams,
        userId: 'user-002',
      });
      expect(hash1).not.toBe(hash2);
    });

    it('produces different hashes when passwordConfirmation differs', async () => {
      const hash1 = await generateSignatureHash(defaultParams);
      const hash2 = await generateSignatureHash({
        ...defaultParams,
        passwordConfirmation: 'different-password',
      });
      expect(hash1).not.toBe(hash2);
    });

    it('returns a valid hex string', async () => {
      const hash = await generateSignatureHash(defaultParams);
      // SHA-256 produces 64 hex chars; fallback produces 16 hex chars
      expect(hash).toMatch(/^[0-9a-f]+$/);
      expect(hash.length).toBeGreaterThanOrEqual(16);
    });
  });

  // =========================================================================
  // generateSignatureHashSync
  // =========================================================================
  describe('generateSignatureHashSync', () => {
    it('produces a deterministic hash for the same inputs', () => {
      const hash1 = generateSignatureHashSync(defaultParams);
      const hash2 = generateSignatureHashSync(defaultParams);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = generateSignatureHashSync(defaultParams);
      const hash2 = generateSignatureHashSync({
        ...defaultParams,
        recordId: 'rec-999',
      });
      expect(hash1).not.toBe(hash2);
    });

    it('returns a valid hex string', () => {
      const hash = generateSignatureHashSync(defaultParams);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  // =========================================================================
  // verifySignatureHash
  // =========================================================================
  describe('verifySignatureHash', () => {
    it('returns true for a valid signature', async () => {
      const hash = await generateSignatureHash(defaultParams);
      const result = await verifySignatureHash({
        signatureHash: hash,
        ...defaultParams,
      });
      expect(result).toBe(true);
    });

    it('returns false for a tampered signature', async () => {
      const hash = await generateSignatureHash(defaultParams);
      const tamperedHash = hash.slice(0, -4) + 'ffff';
      const result = await verifySignatureHash({
        signatureHash: tamperedHash,
        ...defaultParams,
      });
      expect(result).toBe(false);
    });

    it('returns false when inputs differ from original', async () => {
      const hash = await generateSignatureHash(defaultParams);
      const result = await verifySignatureHash({
        signatureHash: hash,
        ...defaultParams,
        userId: 'user-attacker',
      });
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // createSignatureRecord
  // =========================================================================
  describe('createSignatureRecord', () => {
    it('returns an ElectronicSignature object with all required fields', async () => {
      const signature = await createSignatureRecord({
        userId: 'user-001',
        recordId: 'rec-sign-001',
        signatureType: 'approval' as SignatureType,
        signerName: 'Marie Dupont',
        signerRole: 'admin',
        passwordConfirmation: 'my-password',
      });

      expect(signature).toHaveProperty('id');
      expect(signature).toHaveProperty('documentId', 'rec-sign-001');
      expect(signature).toHaveProperty('signedById', 'user-001');
      expect(signature).toHaveProperty('signerName', 'Marie Dupont');
      expect(signature).toHaveProperty('signerRole', 'admin');
      expect(signature).toHaveProperty('signatureType', 'approval');
      expect(signature).toHaveProperty('signatureHash');
      expect(signature).toHaveProperty('userAgent');
      expect(signature).toHaveProperty('revoked', false);
      expect(signature).toHaveProperty('createdAt');
    });

    it('generates a correct hash', async () => {
      const signature = await createSignatureRecord({
        userId: 'user-001',
        recordId: 'rec-hash-001',
        signatureType: 'review' as SignatureType,
        signerName: 'Test Signer',
        signerRole: 'quality_manager',
        passwordConfirmation: 'test-pass',
      });

      expect(signature.signatureHash).toBeTruthy();
      expect(signature.signatureHash).toMatch(/^[0-9a-f]+$/);
    });

    it('records timestamp in UTC ISO format', async () => {
      const beforeCreate = new Date().toISOString();
      const signature = await createSignatureRecord({
        userId: 'user-001',
        recordId: 'rec-time-001',
        signatureType: 'approval' as SignatureType,
        signerName: 'Time Tester',
        signerRole: 'admin',
        passwordConfirmation: 'pass',
      });
      const afterCreate = new Date().toISOString();

      // Should be a valid ISO timestamp
      expect(signature.createdAt).toBeTruthy();
      const parsed = new Date(signature.createdAt);
      expect(parsed.getTime()).not.toBeNaN();

      // Should be between before and after
      expect(signature.createdAt >= beforeCreate).toBe(true);
      expect(signature.createdAt <= afterCreate).toBe(true);
    });

    it('throws ComplianceError when passwordConfirmation is empty', async () => {
      await expect(
        createSignatureRecord({
          userId: 'user-001',
          recordId: 'rec-no-pass',
          signatureType: 'approval' as SignatureType,
          signerName: 'No Pass',
          signerRole: 'admin',
          passwordConfirmation: '',
        })
      ).rejects.toThrow(ComplianceError);
    });

    it('throws ComplianceError with MISSING_ELECTRONIC_SIGNATURE code when password is empty', async () => {
      try {
        await createSignatureRecord({
          userId: 'user-001',
          recordId: 'rec-no-pass-code',
          signatureType: 'approval' as SignatureType,
          signerName: 'No Pass',
          signerRole: 'admin',
          passwordConfirmation: '',
        });
        expect.fail('Expected ComplianceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ComplianceError);
        expect((error as ComplianceError).code).toBe(COMPLIANCE_CODES.MISSING_ELECTRONIC_SIGNATURE);
      }
    });

    it('throws ComplianceError when passwordConfirmation is whitespace only', async () => {
      await expect(
        createSignatureRecord({
          userId: 'user-001',
          recordId: 'rec-whitespace',
          signatureType: 'approval' as SignatureType,
          signerName: 'Whitespace',
          signerRole: 'admin',
          passwordConfirmation: '   ',
        })
      ).rejects.toThrow(ComplianceError);
    });

    it('logs the signature event to the audit trail', async () => {
      await createSignatureRecord({
        userId: 'user-001',
        recordId: 'rec-audit-001',
        signatureType: 'approval' as SignatureType,
        signerName: 'Audit Tester',
        signerRole: 'admin',
        passwordConfirmation: 'password',
      });

      const store = useQMSStore.getState();
      const signEntry = store.auditTrails.find(
        t => t.recordId === 'rec-audit-001' && t.action === 'SIGN'
      );
      expect(signEntry).toBeDefined();
    });
  });

  // =========================================================================
  // Record lock management
  // =========================================================================
  describe('Record lock management', () => {
    it('isRecordSigned returns true after createSignatureRecord', async () => {
      await createSignatureRecord({
        userId: 'user-001',
        recordId: 'rec-signed-check',
        signatureType: 'approval' as SignatureType,
        signerName: 'Signed Check',
        signerRole: 'admin',
        passwordConfirmation: 'password',
      });

      expect(isRecordSigned('rec-signed-check')).toBe(true);
    });

    it('isRecordSigned returns false for unsigned records', () => {
      expect(isRecordSigned('rec-never-signed')).toBe(false);
    });

    it('enforceRecordNotLocked throws for locked records', async () => {
      // Create a locked batch record in the store
      useQMSStore.setState({
        batchRecords: [
          {
            id: 'batch-locked-001',
            lotNumber: 'LOT-LOCKED',
            productName: 'Test Product',
            manufacturingDate: '2024-01-01',
            status: 'Released',
            isLocked: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      expect(() => enforceRecordNotLocked('batch-locked-001')).toThrow(ComplianceError);
    });

    it('enforceRecordNotLocked does not throw for unlocked records', () => {
      useQMSStore.setState({
        batchRecords: [
          {
            id: 'batch-unlocked-001',
            lotNumber: 'LOT-UNLOCKED',
            productName: 'Test Product',
            manufacturingDate: '2024-01-01',
            status: 'In Progress',
            isLocked: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      expect(() => enforceRecordNotLocked('batch-unlocked-001')).not.toThrow();
    });
  });
});
