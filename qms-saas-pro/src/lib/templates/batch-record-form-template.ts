/**
 * batch-record-form-template.ts
 * ──────────────────────────────────
 * Template Batch Manufacturing Record complet conforme
 * ISO 13485:2016 7.5.9 / EU GMP Annex 15 / FDA 21 CFR 820.188
 *
 * 6 sections - 25+ champs - logique conditionnelle - repeaters
 * Base sur les pratiques reelles de l'industrie pharmaceutique et DM.
 */

import type { RichFormTemplate } from '@/types/rich-form-types';

export const BATCH_RECORD_FORM_TEMPLATE: RichFormTemplate = {
  id: 'rft-batch-001',
  documentId: 'doc-tmr-batch-001',
  title: 'Batch Manufacturing Record',
  version: '2.0',
  isActive: true,
  recordTarget: 'BatchRecord',
  normReference: 'ISO 13485:2016 7.5.9 / EU GMP Annex 15 / FDA 21 CFR 820.188',
  retentionYears: 7,
  closureRequiredFields: [
    'lot_number',
    'product_name',
    'manufacturing_date',
    'batch_size',
    'raw_materials_verified',
    'process_steps_completed',
    'qa_release_signature',
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',

  sections: [

    // ══════════════════════════════════════════════════════════════
    // SECTION 1 — Batch Identification
    // ══════════════════════════════════════════════════════════════
    {
      id: 'br-s1',
      order: 1,
      title: '1. Batch Identification',
      description: 'Identify the batch, product, and manufacturing parameters.',
      normClause: 'ISO 13485 7.5.9',
      collapsible: false,
      fields: [
        {
          id: 'lot_number',
          name: 'lotNumber',
          label: 'Lot Number',
          type: 'text',
          readOnly: true,
          helpText: 'Auto-generated',
          normClause: '7.5.9',
        },
        {
          id: 'product_name',
          name: 'productName',
          label: 'Product Name',
          type: 'text',
          required: true,
          validation: { minLength: 3 },
          placeholder: 'e.g., Acetaminophen 500mg Tablets',
        },
        {
          id: 'product_code',
          name: 'productCode',
          label: 'Product Code',
          type: 'text',
          placeholder: 'e.g., MED-DEV-001',
        },
        {
          id: 'manufacturing_date',
          name: 'manufacturingDate',
          label: 'Manufacturing Date',
          type: 'date',
          required: true,
          requiredForClosure: true,
          normClause: '7.5.9',
        },
        {
          id: 'expiry_date',
          name: 'expiryDate',
          label: 'Expiry Date',
          type: 'date',
          required: true,
        },
        {
          id: 'batch_size',
          name: 'batchSize',
          label: 'Batch Size',
          type: 'number',
          required: true,
          requiredForClosure: true,
          validation: { min: 1 },
        },
        {
          id: 'batch_size_unit',
          name: 'batchSizeUnit',
          label: 'Batch Size Unit',
          type: 'select',
          required: true,
          options: ['units', 'vials', 'tablets', 'capsules', 'liters', 'kg', 'g', 'mL'],
        },
        {
          id: 'sop_reference',
          name: 'sopReference',
          label: 'SOP Reference',
          type: 'text',
          placeholder: 'e.g., SOP-MFG-001 Rev.5',
          normClause: '4.2.3',
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
    // SECTION 2 — Raw Materials & Components
    // ══════════════════════════════════════════════════════════════
    {
      id: 'br-s2',
      order: 2,
      title: '2. Raw Materials & Components',
      description: 'Verify and document all raw materials and components used in this batch.',
      normClause: 'ISO 13485 7.4.3 / 7.5.1',
      collapsible: true,
      defaultCollapsed: false,
      fields: [
        {
          id: 'raw_materials_verified',
          name: 'rawMaterialsVerified',
          label: 'Raw Materials Verified?',
          type: 'yes_no_na',
          required: true,
          requiredForClosure: true,
          helpText: 'All raw materials and components verified against specifications?',
          normClause: '7.4.3 / 7.5.1',
        },
        {
          id: 'raw_materials',
          name: 'rawMaterials',
          label: 'Raw Materials & Components',
          type: 'repeater',
          showIf: { fieldId: 'raw_materials_verified', operator: 'equals', value: 'Yes' },
          columns: [
            { id: 'rm_material',  label: 'Material',    type: 'text',   required: true,  width: 'md' },
            { id: 'rm_lot',       label: 'Lot Number',  type: 'text',   required: true,  width: 'sm' },
            { id: 'rm_supplier',  label: 'Supplier',    type: 'text',   required: false, width: 'md' },
            { id: 'rm_status',    label: 'Status',      type: 'select', required: true,  width: 'sm', options: ['Approved', 'Quarantine', 'Rejected'] },
            { id: 'rm_qty',       label: 'Qty Used',    type: 'text',   required: true,  width: 'sm' },
          ],
          minRows: 1,
        },
        {
          id: 'raw_materials_notes',
          name: 'rawMaterialsNotes',
          label: 'Raw Materials Notes',
          type: 'textarea',
          showIf: { fieldId: 'raw_materials_verified', operator: 'equals', value: 'No' },
          placeholder: 'Explain which materials could not be verified and the reason...',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 3 — Process Steps
    // ══════════════════════════════════════════════════════════════
    {
      id: 'br-s3',
      order: 3,
      title: '3. Process Steps',
      description: 'Document each manufacturing step, expected and actual results, and any deviations.',
      normClause: 'ISO 13485 7.5.1',
      requiredForClosure: true,
      collapsible: true,
      defaultCollapsed: false,
      fields: [
        {
          id: 'process_steps_completed',
          name: 'processStepsCompleted',
          label: 'Process Steps Completed?',
          type: 'yes_no_na',
          required: true,
          requiredForClosure: true,
          normClause: '7.5.1',
        },
        {
          id: 'process_steps',
          name: 'processSteps',
          label: 'Manufacturing Process Steps',
          type: 'repeater',
          showIf: { fieldId: 'process_steps_completed', operator: 'not_equals', value: 'N/A' },
          columns: [
            { id: 'ps_step',        label: 'Step #',           type: 'text',        required: true,  width: 'sm' },
            { id: 'ps_description', label: 'Step Description', type: 'textarea',    required: true,  width: 'lg' },
            { id: 'ps_expected',    label: 'Expected Result',  type: 'text',        required: true,  width: 'md' },
            { id: 'ps_actual',      label: 'Actual Result',    type: 'text',        required: true,  width: 'md' },
            { id: 'ps_operator',    label: 'Operator',         type: 'user_select', required: true,  width: 'md' },
            { id: 'ps_time',        label: 'Time',             type: 'text',        required: false, width: 'sm' },
          ],
          minRows: 1,
        },
        {
          id: 'process_deviations',
          name: 'processDeviations',
          label: 'Process Deviations',
          type: 'textarea',
          helpText: 'Describe any deviations from the standard process',
        },
        {
          id: 'in_process_controls',
          name: 'inProcessControls',
          label: 'In-Process Controls',
          type: 'textarea',
          placeholder: 'List in-process controls performed and results...',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 4 — Quality Control Results
    // ══════════════════════════════════════════════════════════════
    {
      id: 'br-s4',
      order: 4,
      title: '4. Quality Control Results',
      description: 'Document QC testing results and overall quality conclusion for this batch.',
      normClause: 'ISO 13485 7.6',
      requiredForClosure: true,
      collapsible: true,
      defaultCollapsed: false,
      fields: [
        {
          id: 'qc_tests_performed',
          name: 'qcTestsPerformed',
          label: 'QC Tests Performed?',
          type: 'yes_no_na',
          required: true,
          normClause: '7.6',
        },
        {
          id: 'qc_results',
          name: 'qcResults',
          label: 'QC Test Results',
          type: 'repeater',
          showIf: { fieldId: 'qc_tests_performed', operator: 'equals', value: 'Yes' },
          columns: [
            { id: 'qc_test',          label: 'Test',          type: 'text',   required: true,  width: 'md' },
            { id: 'qc_specification', label: 'Specification', type: 'text',   required: true,  width: 'md' },
            { id: 'qc_result',        label: 'Result',        type: 'text',   required: true,  width: 'sm' },
            { id: 'qc_unit',          label: 'Unit',          type: 'text',   required: false, width: 'sm' },
            { id: 'qc_status',        label: 'Status',        type: 'select', required: true,  width: 'sm', options: ['Conforming', 'Non-Conforming', 'N/A'] },
          ],
          minRows: 1,
        },
        {
          id: 'overall_qc_conclusion',
          name: 'overallQcConclusion',
          label: 'Overall QC Conclusion',
          type: 'select',
          required: true,
          options: [
            'All tests conforming',
            'Minor deviations — within limits',
            'Non-conforming results — investigation required',
          ],
        },
        {
          id: 'stability_samples',
          name: 'stabilitySamples',
          label: 'Stability Samples',
          type: 'textarea',
          placeholder: 'List stability samples retained...',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 5 — Environmental & Equipment Records
    // ══════════════════════════════════════════════════════════════
    {
      id: 'br-s5',
      order: 5,
      title: '5. Environmental & Equipment Records',
      description: 'Record environmental conditions and equipment used during manufacturing.',
      normClause: 'ISO 13485 7.5.1',
      collapsible: true,
      defaultCollapsed: true,
      fields: [
        {
          id: 'environmental_conditions',
          name: 'environmentalConditions',
          label: 'Environmental Conditions',
          type: 'textarea',
          placeholder: 'Temperature, humidity, pressure, cleanliness class during manufacturing...',
        },
        {
          id: 'equipment_used',
          name: 'equipmentUsed',
          label: 'Equipment Used',
          type: 'repeater',
          columns: [
            { id: 'eq_name',        label: 'Equipment',         type: 'text',   required: true,  width: 'md' },
            { id: 'eq_id',          label: 'Equipment ID',      type: 'text',   required: true,  width: 'sm' },
            { id: 'eq_calibration', label: 'Calibration Due',   type: 'date',   required: false, width: 'sm' },
            { id: 'eq_status',      label: 'Status',            type: 'select', required: true,  width: 'sm', options: ['Qualified', 'Pending Qualification', 'Out of Calibration'] },
          ],
          minRows: 1,
        },
        {
          id: 'line_clearance',
          name: 'lineClearance',
          label: 'Line Clearance Performed?',
          type: 'yes_no_na',
          required: true,
          normClause: '7.5.1',
        },
        {
          id: 'line_clearance_by',
          name: 'lineClearanceBy',
          label: 'Line Clearance Performed By',
          type: 'user_select',
          showIf: { fieldId: 'line_clearance', operator: 'equals', value: 'Yes' },
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 6 — QA Review & Release
    // ══════════════════════════════════════════════════════════════
    {
      id: 'br-s6',
      order: 6,
      title: '6. QA Review & Release',
      description: 'QA review, release decision, and electronic signature for batch disposition.',
      normClause: 'ISO 13485 7.5.1 / 8.2.4',
      requiredForClosure: true,
      collapsible: false,
      fields: [
        {
          id: 'batch_record_review',
          name: 'batchRecordReview',
          label: 'Batch Record Reviewed?',
          type: 'yes_no_na',
          required: true,
          requiredForClosure: true,
          helpText: 'Has the batch record been reviewed for completeness and accuracy?',
          normClause: '7.5.1 / 8.2.4',
        },
        {
          id: 'review_comments',
          name: 'reviewComments',
          label: 'Review Comments',
          type: 'textarea',
          showIf: { fieldId: 'batch_record_review', operator: 'equals', value: 'No' },
          placeholder: 'Describe issues found during review...',
        },
        {
          id: 'qa_release_signature',
          name: 'qaReleaseSignature',
          label: 'QA Release Signature',
          type: 'signature',
          required: true,
          requiredForClosure: true,
          helpText: 'Electronic signature per 21 CFR Part 11. Your password will be verified against your account.',
          normClause: '21 CFR 11.200 / 7.5.9',
          readOnly: false,
        },
        {
          id: 'release_date',
          name: 'releaseDate',
          label: 'Release Date',
          type: 'date',
          required: true,
          requiredForClosure: true,
          readOnly: true,
          helpText: 'Auto-filled upon QA release signature',
        },
        {
          id: 'batch_disposition',
          name: 'batchDisposition',
          label: 'Batch Disposition',
          type: 'select',
          required: true,
          options: ['Released', 'Quarantined', 'Rejected', 'Rework Required'],
        },
      ],
    },
  ],
};
