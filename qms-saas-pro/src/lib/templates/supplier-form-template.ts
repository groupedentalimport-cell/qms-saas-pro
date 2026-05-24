/**
 * supplier-form-template.ts
 * ────────────────────────────
 * Template Supplier complet conforme ISO 13485 7.4 / FDA 21 CFR 820.50
 *
 * 6 sections - 30+ champs - certifications repeater - risk rating
 * Base sur les pratiques reelles de l'industrie pharmaceutique et DM.
 */

import type { RichFormTemplate } from '@/types/rich-form-types';

export const SUPPLIER_FORM_TEMPLATE: RichFormTemplate = {
  id: 'rft-supplier-001',
  documentId: 'doc-tmr-sup-001',   // Document Control approuve TMR-SUP-001
  title: 'Supplier Qualification & Registration',
  version: '2.0',
  isActive: true,
  recordTarget: 'Supplier',
  normReference: 'ISO 13485:2016 7.4 / FDA 21 CFR 820.50',
  retentionYears: 7,
  closureRequiredFields: [
    'supplier_name',
    'supplier_code',
    'category',
    'qualification_method',
    'risk_level',
    'qa_approval_signature',
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',

  sections: [

    // ══════════════════════════════════════════════════════════════
    // SECTION 1 — Supplier Identification
    // ══════════════════════════════════════════════════════════════
    {
      id: 'sup-s1',
      order: 1,
      title: '1. Supplier Identification',
      description: 'Identify the supplier, its category, and the person initiating the registration.',
      normClause: 'ISO 13485 7.4',
      collapsible: false,
      fields: [
        {
          id: 'supplier_code',
          name: 'supplierCode',
          label: 'Supplier Code',
          type: 'text',
          readOnly: true,
          helpText: 'Auto-generated supplier code',
          normClause: '4.2.4',
        },
        {
          id: 'supplier_name',
          name: 'supplierName',
          label: 'Supplier Name',
          type: 'text',
          required: true,
          validation: { minLength: 3 },
          placeholder: 'Full legal name of the supplier',
        },
        {
          id: 'category',
          name: 'category',
          label: 'Supplier Category',
          type: 'select',
          required: true,
          options: [
            'Raw Material',
            'Packaging',
            'Equipment',
            'Service',
            'Contract Manufacturer',
            'Laboratory',
            'Other',
          ],
          normClause: '7.4',
        },
        {
          id: 'supplier_type',
          name: 'supplierType',
          label: 'Supplier Type',
          type: 'select',
          required: true,
          options: ['Critical', 'Non-Critical'],
          helpText: 'A Critical supplier directly affects product quality, safety, or regulatory compliance. Non-Critical suppliers provide indirect or support materials/services.',
          normClause: '7.4',
        },
        {
          id: 'website',
          name: 'website',
          label: 'Website',
          type: 'text',
          placeholder: 'https://...',
        },
        {
          id: 'initiated_by',
          name: 'initiatedBy',
          label: 'Initiated By',
          type: 'user_select',
          required: true,
          readOnly: true,
          helpText: 'Auto-filled from your session',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 2 — Contact & Location
    // ══════════════════════════════════════════════════════════════
    {
      id: 'sup-s2',
      order: 2,
      title: '2. Contact & Location',
      description: 'Primary and emergency contact information for the supplier.',
      collapsible: true,
      defaultCollapsed: false,
      fields: [
        {
          id: 'contact_name',
          name: 'contactName',
          label: 'Primary Contact Name',
          type: 'text',
          required: true,
          placeholder: 'Full name of primary contact person',
        },
        {
          id: 'contact_email',
          name: 'contactEmail',
          label: 'Contact Email',
          type: 'text',
          required: true,
          placeholder: 'email@supplier.com',
        },
        {
          id: 'contact_phone',
          name: 'contactPhone',
          label: 'Contact Phone',
          type: 'text',
          placeholder: '+1 (555) 000-0000',
        },
        {
          id: 'address',
          name: 'address',
          label: 'Address',
          type: 'textarea',
          required: true,
          placeholder: 'Full street address including building, city, state/province, postal code',
        },
        {
          id: 'country',
          name: 'country',
          label: 'Country',
          type: 'text',
          required: true,
          placeholder: 'Country of operation',
        },
        {
          id: 'emergency_contact',
          name: 'emergencyContact',
          label: 'Emergency Contact Name',
          type: 'text',
          placeholder: 'Name for after-hours or emergency contact',
        },
        {
          id: 'emergency_phone',
          name: 'emergencyPhone',
          label: 'Emergency Phone',
          type: 'text',
          placeholder: '+1 (555) 000-0000',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 3 — Qualification & Approval
    // ══════════════════════════════════════════════════════════════
    {
      id: 'sup-s3',
      order: 3,
      title: '3. Qualification & Approval',
      description: 'Document the qualification method, approval status, and next review date for the supplier.',
      normClause: 'ISO 13485 7.4.1',
      requiredForClosure: true,
      collapsible: true,
      fields: [
        {
          id: 'qualification_status',
          name: 'qualificationStatus',
          label: 'Qualification Status',
          type: 'select',
          required: true,
          options: ['Under Evaluation', 'Conditional', 'Qualified'],
          normClause: '7.4.1',
          helpText: 'Under Evaluation: initial assessment in progress / Conditional: approved with limitations / Qualified: fully approved',
        },
        {
          id: 'qualification_method',
          name: 'qualificationMethod',
          label: 'Qualification Method',
          type: 'select',
          required: true,
          requiredForClosure: true,
          options: [
            'On-site Audit',
            'Desktop Audit',
            'Questionnaire',
            'Historical Performance',
            'Sample Testing',
          ],
          normClause: '7.4.1',
          helpText: 'Method used to evaluate and qualify this supplier',
        },
        {
          id: 'qualification_date',
          name: 'qualificationDate',
          label: 'Qualification Date',
          type: 'date',
          helpText: 'Date the qualification assessment was completed',
        },
        {
          id: 'next_review_date',
          name: 'nextReviewDate',
          label: 'Next Review Date',
          type: 'date',
          required: true,
          helpText: 'Date for periodic re-evaluation. Per ISO 13485 7.4.1, suppliers must be re-evaluated at defined intervals based on risk level and performance.',
          normClause: '7.4.1',
        },
        {
          id: 'approved_by',
          name: 'approvedBy',
          label: 'Approved By',
          type: 'user_select',
          required: true,
          normClause: '7.4.1',
          helpText: 'Person responsible for approving the supplier qualification',
        },
        {
          id: 'qualification_doc_ref',
          name: 'qualificationDocRef',
          label: 'Qualification Document Reference',
          type: 'text',
          placeholder: 'Document reference for qualification report',
          helpText: 'Reference number of the approved qualification report or assessment document',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 4 — Certifications & Compliance
    // ══════════════════════════════════════════════════════════════
    {
      id: 'sup-s4',
      order: 4,
      title: '4. Certifications & Compliance',
      description: 'Record the supplier\'s certifications, applicable regulations, and agreement status.',
      normClause: 'ISO 13485 7.4.2',
      collapsible: true,
      fields: [
        {
          id: 'certifications',
          name: 'certifications',
          label: 'Certifications',
          type: 'repeater',
          helpText: 'List all relevant certifications held by the supplier (e.g. ISO 13485, ISO 9001, CE, FDA Registration)',
          columns: [
            { id: 'cert_name',   label: 'Certification', type: 'text', required: true,  width: 'md' },
            { id: 'cert_number', label: 'Certificate #',  type: 'text', required: false, width: 'md' },
            { id: 'cert_expiry', label: 'Expiry Date',    type: 'date', required: true,  width: 'sm' },
          ],
          minRows: 1,
        },
        {
          id: 'regulations',
          name: 'regulations',
          label: 'Applicable Regulations',
          type: 'textarea',
          placeholder: 'List applicable regulations...',
          helpText: 'Regulations and standards the supplier must comply with (e.g. 21 CFR 820, EU MDR, ISO 14971)',
        },
        {
          id: 'quality_agreement',
          name: 'qualityAgreement',
          label: 'Quality Agreement in Place?',
          type: 'yes_no_na',
          required: true,
          normClause: '7.4.2',
          helpText: 'A Quality Agreement defines the responsibilities of both parties regarding product quality, change control, and complaint handling',
        },
        {
          id: 'confidentiality_agreement',
          name: 'confidentialityAgreement',
          label: 'Confidentiality Agreement in Place?',
          type: 'yes_no_na',
          required: true,
          helpText: 'A Confidentiality (or Non-Disclosure) Agreement protects proprietary information shared with the supplier',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 5 — Risk Assessment & Performance
    // ══════════════════════════════════════════════════════════════
    {
      id: 'sup-s5',
      order: 5,
      title: '5. Risk Assessment & Performance',
      description: 'Assess the supplier risk level, monitoring frequency, and key performance indicators.',
      normClause: 'ISO 13485 7.4.1 / ISO 14971',
      requiredForClosure: true,
      collapsible: true,
      fields: [
        {
          id: 'risk_level',
          name: 'riskLevel',
          label: 'Risk Level',
          type: 'select',
          required: true,
          requiredForClosure: true,
          options: ['Low', 'Medium', 'High', 'Critical'],
          normClause: '7.4.1 / ISO 14971',
          helpText: 'Low: minimal impact on product quality / Medium: moderate impact / High: significant impact / Critical: direct impact on patient safety or regulatory compliance',
        },
        {
          id: 'monitoring_frequency',
          name: 'monitoringFrequency',
          label: 'Monitoring Frequency',
          type: 'select',
          required: true,
          options: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
          helpText: 'Frequency of periodic supplier performance monitoring and review',
        },
        {
          id: 'performance_score',
          name: 'performanceScore',
          label: 'Performance Score',
          type: 'rating',
          ratingMin: 1,
          ratingMax: 5,
          ratingLabels: [
            'Unacceptable',
            'Needs Improvement',
            'Acceptable',
            'Good',
            'Excellent',
          ],
          helpText: 'Overall supplier performance rating based on quality, delivery, and responsiveness',
          normClause: '7.4.1',
        },
        {
          id: 'evaluation_criteria',
          name: 'evaluationCriteria',
          label: 'Evaluation Criteria',
          type: 'textarea',
          required: true,
          helpText: 'Define measurable criteria for supplier evaluation',
          placeholder: 'e.g. On-time delivery rate >= 95%, NCR rate < 1%, batch rejection rate < 0.5%, response time to complaints < 48h...',
          normClause: '7.4.1',
        },
        {
          id: 'delivery_performance',
          name: 'deliveryPerformance',
          label: 'Delivery Performance',
          type: 'select',
          options: [
            '≥ 98% On-time',
            '95-98% On-time',
            '90-95% On-time',
            '< 90% On-time',
          ],
          helpText: 'Historical on-time delivery performance of the supplier',
        },
        {
          id: 'ncr_rate',
          name: 'ncrRate',
          label: 'NCR Rate',
          type: 'select',
          options: [
            '0 NCRs',
            '1-2 NCRs/year',
            '3-5 NCRs/year',
            '> 5 NCRs/year',
          ],
          helpText: 'Number of Non-Conformance Reports associated with this supplier per year',
          normClause: '7.4.3',
        },
        {
          id: 'linked_qualification_doc',
          name: 'linkedQualificationDoc',
          label: 'Linked Qualification Document',
          type: 'text',
          placeholder: 'Link to approved qualification document',
          helpText: 'Reference or link to the approved supplier qualification document in the document management system',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 6 — Approval & Closure
    // ══════════════════════════════════════════════════════════════
    {
      id: 'sup-s6',
      order: 6,
      title: '6. Approval & Closure',
      description: 'Final QA approval and formal closure of the supplier qualification record.',
      normClause: '21 CFR 11.200 / 7.4',
      requiredForClosure: true,
      collapsible: false,
      fields: [
        {
          id: 'qa_approval_signature',
          name: 'qaApprovalSignature',
          label: 'QA Approval Signature — Supplier Qualification',
          type: 'signature',
          required: true,
          requiredForClosure: true,
          helpText: 'Electronic signature per 21 CFR Part 11. Confirms the supplier has been evaluated and approved per applicable procedures.',
          normClause: '21 CFR 11.200 / 7.4',
          readOnly: false,
        },
        {
          id: 'closure_date',
          name: 'closureDate',
          label: 'Effective Closure Date',
          type: 'date',
          required: true,
          requiredForClosure: true,
          readOnly: true,
          helpText: 'Auto-filled upon QA signature',
        },
      ],
    },
  ],
};
