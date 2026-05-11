import { describe, it, expect } from 'vitest';
import {
  QMSError,
  ComplianceError,
  COMPLIANCE_CODES,
  type ComplianceCode,
} from '@/lib/errors';

// ---------------------------------------------------------------------------
// QMSError
// ---------------------------------------------------------------------------
describe('QMSError', () => {
  it('extends the native Error class', () => {
    const err = new QMSError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(QMSError);
  });

  it('sets name to "QMSError"', () => {
    const err = new QMSError('test');
    expect(err.name).toBe('QMSError');
  });

  it('preserves the message', () => {
    const err = new QMSError('something went wrong');
    expect(err.message).toBe('something went wrong');
  });

  it('can be caught with instanceof', () => {
    const throwIt = () => {
      throw new QMSError('boom');
    };
    expect(throwIt).toThrow(QMSError);
  });

  it('has a proper stack trace', () => {
    const err = new QMSError('stack check');
    expect(err.stack).toContain('QMSError');
  });
});

// ---------------------------------------------------------------------------
// ComplianceError
// ---------------------------------------------------------------------------
describe('ComplianceError', () => {
  it('extends QMSError', () => {
    const err = new ComplianceError('msg', 'CODE');
    expect(err).toBeInstanceOf(QMSError);
    expect(err).toBeInstanceOf(ComplianceError);
  });

  it('extends Error (through QMSError)', () => {
    const err = new ComplianceError('msg', 'CODE');
    expect(err).toBeInstanceOf(Error);
  });

  it('sets name to "ComplianceError"', () => {
    const err = new ComplianceError('msg', 'CODE');
    expect(err.name).toBe('ComplianceError');
  });

  it('preserves the message', () => {
    const err = new ComplianceError('access denied', 'INSUFFICIENT_PERMISSIONS');
    expect(err.message).toBe('access denied');
  });

  it('has a code property', () => {
    const err = new ComplianceError('locked', 'DOCUMENT_LOCKED');
    expect(err).toHaveProperty('code', 'DOCUMENT_LOCKED');
  });

  it('can be caught with instanceof', () => {
    const throwIt = () => {
      throw new ComplianceError('fail', 'CODE');
    };
    expect(throwIt).toThrow(ComplianceError);
  });
});

// ---------------------------------------------------------------------------
// COMPLIANCE_CODES
// ---------------------------------------------------------------------------
describe('COMPLIANCE_CODES', () => {
  const expectedCodes = [
    'PREREQUISITE_NOT_MET',
    'DOCUMENT_LOCKED',
    'BATCH_LOCKED',
    'VALIDATION_SEQUENCE_ERROR',
    'FORM_LOCKED',
    'INSUFFICIENT_PERMISSIONS',
    'MISSING_ELECTRONIC_SIGNATURE',
    'INVALID_STATUS_TRANSITION',
    'DUPLICATE_RECORD',
    'REQUIRED_FIELD_MISSING',
  ] as const;

  it('has exactly 10 codes', () => {
    expect(Object.keys(COMPLIANCE_CODES)).toHaveLength(10);
  });

  it.each(expectedCodes)('contains the code "%s"', (code) => {
    expect(COMPLIANCE_CODES).toHaveProperty(code);
  });

  it.each(expectedCodes)('value of "%s" matches its key', (code) => {
    expect(COMPLIANCE_CODES[code as keyof typeof COMPLIANCE_CODES]).toBe(code);
  });

  it('every value is identical to its key', () => {
    for (const key of Object.keys(COMPLIANCE_CODES)) {
      expect(COMPLIANCE_CODES[key as keyof typeof COMPLIANCE_CODES]).toBe(key);
    }
  });
});

// ---------------------------------------------------------------------------
// ComplianceCode type — runtime verification that all codes are included
// ---------------------------------------------------------------------------
describe('ComplianceCode', () => {
  it('every COMPLIANCE_CODES value is a valid ComplianceCode', () => {
    const allCodes: ComplianceCode[] = Object.values(COMPLIANCE_CODES);
    expect(allCodes).toHaveLength(10);

    // Each code should be assignable to ComplianceCode (this is a compile-time
    // check, but we can verify runtime uniqueness too)
    const unique = new Set<ComplianceCode>(allCodes);
    expect(unique.size).toBe(10);
  });

  it('ComplianceCode matches the union of all code values', () => {
    const codes = Object.values(COMPLIANCE_CODES) as ComplianceCode[];
    const expected: ComplianceCode[] = [
      'PREREQUISITE_NOT_MET',
      'DOCUMENT_LOCKED',
      'BATCH_LOCKED',
      'VALIDATION_SEQUENCE_ERROR',
      'FORM_LOCKED',
      'INSUFFICIENT_PERMISSIONS',
      'MISSING_ELECTRONIC_SIGNATURE',
      'INVALID_STATUS_TRANSITION',
      'DUPLICATE_RECORD',
      'REQUIRED_FIELD_MISSING',
    ];
    expect(codes.sort()).toEqual(expected.sort());
  });
});
