// Industry-Specific Compliance Checklists for QMS SaaS Pro
// Each checklist provides clauses and status computation logic per regulatory framework

// ============================================================================
// Types
// ============================================================================

export type ClauseCategory = 'quality_system' | 'management' | 'resources' | 'realization' | 'measurement' | 'improvement';
export type ClauseStatus = 'compliant' | 'partially' | 'non_compliant' | 'not_assessed';

export interface ComplianceData {
  approvedDocCount: number;
  totalDocCount: number;
  closedCapaCount: number;
  totalCapaCount: number;
  completedTrainingCount: number;
  totalTrainingCount: number;
  completedAuditCount: number;
  totalAuditCount: number;
  closedNcrCount: number;
  totalNcrCount: number;
  openRiskCount: number;
  totalRiskCount: number;
  releasedBatchCount: number;
  totalBatchCount: number;
  qualifiedSupplierCount: number;
  totalSupplierCount: number;
  inReviewDocCount: number;
  recordDocCount: number;
  validationDocCount: number;
  batchWithProductCodeCount: number;
  capaWithRootCauseCount: number;
  changeControlOpenCount: number;
  deviationOpenCount: number;
}

export interface ComplianceClause {
  id: string;
  clause: string;
  title: string;
  description: string;
  category: ClauseCategory;
  computeStatus: (data: ComplianceData) => ClauseStatus;
}

export interface ComplianceChecklist {
  id: string;
  name: string;
  standard: string;
  clauses: ComplianceClause[];
}

// ============================================================================
// Helpers
// ============================================================================

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

function statusFromPct(p: number): ClauseStatus {
  if (p >= 80) return 'compliant';
  if (p >= 50) return 'partially';
  if (p > 0) return 'non_compliant';
  return 'not_assessed';
}

function statusFromBool(val: boolean, hasData: boolean): ClauseStatus {
  if (!hasData) return 'not_assessed';
  return val ? 'compliant' : 'non_compliant';
}

// ============================================================================
// ISO 13485:2016 Checklist
// Used for: medical_device, combination_product
// ============================================================================

const iso13485Checklist: ComplianceChecklist = {
  id: 'iso13485',
  name: 'ISO 13485:2016 Compliance Checklist',
  standard: 'ISO 13485:2016',
  clauses: [
    {
      id: 'iso-4.1',
      clause: '4.1',
      title: 'General Requirements',
      description: 'The organization shall establish, document, implement, and maintain a quality management system.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount, data.totalDocCount)),
    },
    {
      id: 'iso-4.2',
      clause: '4.2',
      title: 'Documentation Requirements',
      description: 'The quality management system documentation shall include a quality policy, quality objectives, and a quality manual.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount, data.totalDocCount)),
    },
    {
      id: 'iso-4.2.3',
      clause: '4.2.3',
      title: 'Document Control',
      description: 'Documents required by the quality management system shall be controlled. A documented procedure shall be established.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount + data.inReviewDocCount, data.totalDocCount)),
    },
    {
      id: 'iso-4.2.4',
      clause: '4.2.4',
      title: 'Record Control',
      description: 'Records shall be established and maintained to provide evidence of conformity to requirements.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.recordDocCount, data.totalDocCount)),
    },
    {
      id: 'iso-5',
      clause: '5',
      title: 'Management Responsibility',
      description: 'Top management shall demonstrate commitment to the development and implementation of the QMS.',
      category: 'management',
      computeStatus: (data) => statusFromPct(pct(data.completedAuditCount, data.totalAuditCount)),
    },
    {
      id: 'iso-5.6',
      clause: '5.6',
      title: 'Management Review',
      description: 'Top management shall review the QMS at planned intervals to ensure its continuing suitability.',
      category: 'management',
      computeStatus: (data) => statusFromPct(pct(data.completedAuditCount, data.totalAuditCount)),
    },
    {
      id: 'iso-6',
      clause: '6',
      title: 'Resource Management',
      description: 'The organization shall determine and provide the resources needed to implement and maintain the QMS.',
      category: 'resources',
      computeStatus: (data) => statusFromPct(pct(data.completedTrainingCount, data.totalTrainingCount)),
    },
    {
      id: 'iso-7.1',
      clause: '7.1',
      title: 'Planning of Product Realization',
      description: 'The organization shall plan and develop the processes needed for product realization.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.totalRiskCount - data.openRiskCount, data.totalRiskCount)),
    },
    {
      id: 'iso-7.5',
      clause: '7.5',
      title: 'Production and Service Provision',
      description: 'The organization shall plan and carry out production under controlled conditions.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.releasedBatchCount, data.totalBatchCount)),
    },
    {
      id: 'iso-7.5.6',
      clause: '7.5.6',
      title: 'Validation of Processes',
      description: 'The organization shall validate any processes for production and service provision where the resulting output cannot be verified.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.validationDocCount, data.totalDocCount)),
    },
    {
      id: 'iso-7.5.9',
      clause: '7.5.9',
      title: 'Traceability',
      description: 'The organization shall establish and maintain records to provide traceability of product.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.batchWithProductCodeCount, data.totalBatchCount)),
    },
    {
      id: 'iso-8.2',
      clause: '8.2',
      title: 'Monitoring and Measurement',
      description: 'The organization shall monitor and measure the characteristics of the product to verify that requirements are met.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.completedAuditCount, data.totalAuditCount)),
    },
    {
      id: 'iso-8.3',
      clause: '8.3',
      title: 'Non-Conforming Product',
      description: 'The organization shall ensure that product which does not conform to requirements is identified and controlled.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.closedNcrCount, data.totalNcrCount)),
    },
    {
      id: 'iso-8.4',
      clause: '8.4',
      title: 'Analysis of Data',
      description: 'The organization shall determine, collect, and analyze appropriate data to demonstrate the suitability and effectiveness of the QMS.',
      category: 'improvement',
      computeStatus: (data) => statusFromPct(pct(data.capaWithRootCauseCount, data.totalCapaCount)),
    },
    {
      id: 'iso-8.5',
      clause: '8.5',
      title: 'Improvement',
      description: 'The organization shall continually improve the effectiveness of the QMS through the use of the quality policy, audit results, and corrective actions.',
      category: 'improvement',
      computeStatus: (data) => statusFromPct(pct(data.closedCapaCount, data.totalCapaCount)),
    },
  ],
};

// ============================================================================
// ICH Q10 Checklist
// Used for: pharmaceutical, biotech
// ============================================================================

const ichq10Checklist: ComplianceChecklist = {
  id: 'ichq10',
  name: 'ICH Q10 Pharmaceutical Quality System Checklist',
  standard: 'ICH Q10',
  clauses: [
    {
      id: 'ich-1',
      clause: '1',
      title: 'Pharmaceutical Quality System (PQS)',
      description: 'The organization shall establish and maintain a pharmaceutical quality system including senior management oversight.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount, data.totalDocCount)),
    },
    {
      id: 'ich-2.1',
      clause: '2.1',
      title: 'Senior Management Responsibility',
      description: 'Senior management has the ultimate responsibility to ensure an effective pharmaceutical quality system is in place.',
      category: 'management',
      computeStatus: (data) => statusFromPct(pct(data.completedAuditCount, data.totalAuditCount)),
    },
    {
      id: 'ich-2.2',
      clause: '2.2',
      title: 'Management Review',
      description: 'Management review should ensure that the PQS is effective and supports continual improvement.',
      category: 'management',
      computeStatus: (data) => statusFromPct(pct(data.completedAuditCount, data.totalAuditCount)),
    },
    {
      id: 'ich-3.1',
      clause: '3.1',
      title: 'Process Performance & Product Quality',
      description: 'The organization should monitor process performance and product quality to ensure a state of control is maintained.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.releasedBatchCount, data.totalBatchCount)),
    },
    {
      id: 'ich-3.2',
      clause: '3.2',
      title: 'Corrective Action & Preventive Action (CAPA)',
      description: 'The organization should have a system for implementing CAPA to identify and address root causes of quality issues.',
      category: 'improvement',
      computeStatus: (data) => statusFromPct(pct(data.closedCapaCount, data.totalCapaCount)),
    },
    {
      id: 'ich-3.2.1',
      clause: '3.2.1',
      title: 'Root Cause Investigation',
      description: 'CAPA should include root cause investigation and analysis to identify the underlying cause of quality issues.',
      category: 'improvement',
      computeStatus: (data) => statusFromPct(pct(data.capaWithRootCauseCount, data.totalCapaCount)),
    },
    {
      id: 'ich-3.3',
      clause: '3.3',
      title: 'Change Management',
      description: 'The organization should have a systematic approach to change management to evaluate and approve changes.',
      category: 'quality_system',
      computeStatus: (data) => statusFromBool(data.changeControlOpenCount < 5, data.changeControlOpenCount > 0 || data.closedCapaCount > 0),
    },
    {
      id: 'ich-4',
      clause: '4',
      title: 'Resource Management',
      description: 'The organization should provide adequate resources including trained personnel for the PQS.',
      category: 'resources',
      computeStatus: (data) => statusFromPct(pct(data.completedTrainingCount, data.totalTrainingCount)),
    },
    {
      id: 'ich-5',
      clause: '5',
      title: 'Manufacturing Operations & Batch Release',
      description: 'Manufacturing operations should be carried out under controlled conditions with documented batch records and QA release.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.releasedBatchCount, data.totalBatchCount)),
    },
    {
      id: 'ich-5.1',
      clause: '5.1',
      title: 'Supplier Qualification',
      description: 'The organization should qualify and monitor suppliers of materials and services critical to product quality.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.qualifiedSupplierCount, data.totalSupplierCount)),
    },
    {
      id: 'ich-6',
      clause: '6',
      title: 'Non-Conformance & Deviation Management',
      description: 'The organization should investigate non-conformances and deviations, and implement appropriate corrective actions.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.closedNcrCount, data.totalNcrCount)),
    },
    {
      id: 'ich-7',
      clause: '7',
      title: 'Document Control & Records',
      description: 'The organization should maintain documentation and records that define the quality system and support compliance.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount + data.inReviewDocCount, data.totalDocCount)),
    },
    {
      id: 'ich-8',
      clause: '8',
      title: 'Risk Management',
      description: 'The organization should implement risk management principles as part of the pharmaceutical quality system.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.totalRiskCount - data.openRiskCount, data.totalRiskCount)),
    },
  ],
};

// ============================================================================
// IVDR EU 2017/746 Checklist
// Used for: ivd
// ============================================================================

const ivdrChecklist: ComplianceChecklist = {
  id: 'ivdr',
  name: 'IVDR EU 2017/746 Compliance Checklist',
  standard: 'IVDR EU 2017/746',
  clauses: [
    {
      id: 'ivdr-4',
      clause: 'Art. 4',
      title: 'General Obligations of Manufacturers',
      description: 'Manufacturers shall ensure that devices are designed and manufactured in accordance with the requirements of this Regulation.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount, data.totalDocCount)),
    },
    {
      id: 'ivdr-8',
      clause: 'Art. 8',
      title: 'Obligations of Manufacturers Regarding Devices',
      description: 'When making a device available on the market, manufacturers shall ensure it has been designed and manufactured in accordance with the safety and performance requirements.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount, data.totalDocCount)),
    },
    {
      id: 'ivdr-10',
      clause: 'Art. 10',
      title: 'Quality Management System',
      description: 'Manufacturers shall establish, document, and implement a quality management system that is maintained and kept up to date.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount, data.totalDocCount)),
    },
    {
      id: 'ivdr-10.4',
      clause: 'Art. 10(4)',
      title: 'Post-Market Surveillance System',
      description: 'Manufacturers shall establish and keep up to date a post-market surveillance system proportionate to the risk and appropriate for the device.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.closedNcrCount, data.totalNcrCount)),
    },
    {
      id: 'ivdr-10.9',
      clause: 'Art. 10(9)',
      title: 'Corrective Actions & Field Safety Notices',
      description: 'Manufacturers shall immediately inform competent authorities of corrective actions and field safety corrective actions.',
      category: 'improvement',
      computeStatus: (data) => statusFromPct(pct(data.closedCapaCount, data.totalCapaCount)),
    },
    {
      id: 'ivdr-12',
      clause: 'Art. 12',
      title: 'Technical Documentation',
      description: 'Manufacturers shall draw up and keep up to date technical documentation that allows assessment of conformity.',
      category: 'quality_system',
      computeStatus: (data) => statusFromPct(pct(data.approvedDocCount + data.inReviewDocCount, data.totalDocCount)),
    },
    {
      id: 'ivdr-13',
      clause: 'Art. 13',
      title: 'Risk Management System',
      description: 'Manufacturers shall establish, document, implement, and maintain a risk management system as described in relevant harmonized standards.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.totalRiskCount - data.openRiskCount, data.totalRiskCount)),
    },
    {
      id: 'ivdr-15',
      clause: 'Art. 15',
      title: 'Person Responsible for Regulatory Compliance',
      description: 'Manufacturers shall have available within their organization at least one person responsible for regulatory compliance (PRRC).',
      category: 'management',
      computeStatus: (data) => statusFromPct(pct(data.completedTrainingCount, data.totalTrainingCount)),
    },
    {
      id: 'ivdr-16',
      clause: 'Art. 16',
      title: 'Traceability of Devices',
      description: 'Manufacturers shall ensure that devices can be traced throughout the supply chain with UDI compliance.',
      category: 'realization',
      computeStatus: (data) => statusFromPct(pct(data.batchWithProductCodeCount, data.totalBatchCount)),
    },
    {
      id: 'ivdr-56',
      clause: 'Art. 56',
      title: 'Performance Evaluation',
      description: 'Manufacturers shall establish and update a performance evaluation for their IVD devices in accordance with Annex XIII.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.completedAuditCount, data.totalAuditCount)),
    },
    {
      id: 'ivdr-83',
      clause: 'Art. 83',
      title: 'Post-Market Surveillance Plan',
      description: 'The post-market surveillance plan shall include collection and analysis of data to verify safety and performance.',
      category: 'measurement',
      computeStatus: (data) => statusFromPct(pct(data.closedNcrCount, data.totalNcrCount)),
    },
    {
      id: 'ivdr-87',
      clause: 'Art. 87',
      title: 'Reporting of Serious Incidents',
      description: 'Manufacturers shall report serious incidents to competent authorities in accordance with the timelines set out in this Regulation.',
      category: 'improvement',
      computeStatus: (data) => statusFromPct(pct(data.closedCapaCount, data.totalCapaCount)),
    },
  ],
};

// ============================================================================
// Checklist Registry
// ============================================================================

export const COMPLIANCE_CHECKLISTS: Record<string, ComplianceChecklist> = {
  iso13485: iso13485Checklist,
  ichq10: ichq10Checklist,
  ivdr: ivdrChecklist,
};

export function getChecklistById(id: string): ComplianceChecklist | undefined {
  return COMPLIANCE_CHECKLISTS[id];
}

export function getChecklistForIndustry(industryType: string): ComplianceChecklist {
  // Import INDUSTRY_CONFIG mapping
  const checklistMap: Record<string, string> = {
    medical_device: 'iso13485',
    pharmaceutical: 'ichq10',
    biotech: 'ichq10',
    ivd: 'ivdr',
    combination_product: 'iso13485',
  };
  const checklistId = checklistMap[industryType] || 'iso13485';
  return COMPLIANCE_CHECKLISTS[checklistId] || iso13485Checklist;
}

/**
 * Build ComplianceData from the store data
 */
export function buildComplianceData(params: {
  documents: { status: string; type: string }[];
  capas: { status: string; rootCauseAnalysis?: string }[];
  trainingItems: { status: string }[];
  audits: { status: string }[];
  ncrs: { status: string }[];
  risks: { status: string }[];
  batchRecords: { status: string; productCode?: string }[];
  suppliers: { status: string }[];
  changeControls: { status: string }[];
  deviations: { status: string }[];
}): ComplianceData {
  const { documents, capas, trainingItems, audits, ncrs, risks, batchRecords, suppliers, changeControls, deviations } = params;

  return {
    approvedDocCount: documents.filter(d => d.status === 'Approved').length,
    totalDocCount: documents.length,
    closedCapaCount: capas.filter(c => c.status === 'Closed').length,
    totalCapaCount: capas.length,
    completedTrainingCount: trainingItems.filter(t => t.status === 'Completed').length,
    totalTrainingCount: trainingItems.length,
    completedAuditCount: audits.filter(a => a.status === 'Completed').length,
    totalAuditCount: audits.length,
    closedNcrCount: ncrs.filter(n => n.status === 'Closed').length,
    totalNcrCount: ncrs.length,
    openRiskCount: risks.filter(r => r.status === 'Open').length,
    totalRiskCount: risks.length,
    releasedBatchCount: batchRecords.filter(b => b.status === 'Released').length,
    totalBatchCount: batchRecords.length,
    qualifiedSupplierCount: suppliers.filter(s => s.status === 'Qualified').length,
    totalSupplierCount: suppliers.length,
    inReviewDocCount: documents.filter(d => d.status === 'In Review').length,
    recordDocCount: documents.filter(d => d.type === 'Record' || d.type === 'Form').length,
    validationDocCount: documents.filter(d => d.type === 'Validation Protocol').length,
    batchWithProductCodeCount: batchRecords.filter(b => !!b.productCode).length,
    capaWithRootCauseCount: capas.filter(c => !!c.rootCauseAnalysis).length,
    changeControlOpenCount: changeControls.filter(cc => cc.status !== 'Completed' && cc.status !== 'Rejected').length,
    deviationOpenCount: deviations.filter(d => d.status !== 'Closed' && d.status !== 'Approved').length,
  };
}
