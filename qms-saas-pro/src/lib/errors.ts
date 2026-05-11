// QMS Error Classes

export class QMSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QMSError';
  }
}

export class ComplianceError extends QMSError {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ComplianceError';
    this.code = code;
  }
}

// Predefined compliance error codes
export const COMPLIANCE_CODES = {
  PREREQUISITE_NOT_MET: 'PREREQUISITE_NOT_MET',
  DOCUMENT_LOCKED: 'DOCUMENT_LOCKED',
  BATCH_LOCKED: 'BATCH_LOCKED',
  VALIDATION_SEQUENCE_ERROR: 'VALIDATION_SEQUENCE_ERROR',
  FORM_LOCKED: 'FORM_LOCKED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  MISSING_ELECTRONIC_SIGNATURE: 'MISSING_ELECTRONIC_SIGNATURE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
} as const;

export type ComplianceCode = typeof COMPLIANCE_CODES[keyof typeof COMPLIANCE_CODES];
