import {
  getChecklistById,
  getChecklistForIndustry,
  buildComplianceData,
  COMPLIANCE_CHECKLISTS,
  type ComplianceData,
  type ClauseStatus,
} from '@/lib/compliance-checklists';

// ============================================================================
// Helper: full compliance data (100% everything)
// ============================================================================

function fullComplianceData(): ComplianceData {
  return {
    approvedDocCount: 10,
    totalDocCount: 10,
    closedCapaCount: 5,
    totalCapaCount: 5,
    completedTrainingCount: 8,
    totalTrainingCount: 8,
    completedAuditCount: 3,
    totalAuditCount: 3,
    closedNcrCount: 4,
    totalNcrCount: 4,
    openRiskCount: 0,
    totalRiskCount: 6,
    releasedBatchCount: 7,
    totalBatchCount: 7,
    qualifiedSupplierCount: 4,
    totalSupplierCount: 4,
    inReviewDocCount: 0,
    recordDocCount: 10,
    validationDocCount: 10,
    batchWithProductCodeCount: 7,
    capaWithRootCauseCount: 5,
    changeControlOpenCount: 1,
    deviationOpenCount: 0,
  };
}

// Zero data — all counts 0, totals non-zero to avoid division-by-zero path
function zeroComplianceData(): ComplianceData {
  return {
    approvedDocCount: 0,
    totalDocCount: 10,
    closedCapaCount: 0,
    totalCapaCount: 5,
    completedTrainingCount: 0,
    totalTrainingCount: 8,
    completedAuditCount: 0,
    totalAuditCount: 3,
    closedNcrCount: 0,
    totalNcrCount: 4,
    openRiskCount: 6,
    totalRiskCount: 6,
    releasedBatchCount: 0,
    totalBatchCount: 7,
    qualifiedSupplierCount: 0,
    totalSupplierCount: 4,
    inReviewDocCount: 0,
    recordDocCount: 0,
    validationDocCount: 0,
    batchWithProductCodeCount: 0,
    capaWithRootCauseCount: 0,
    changeControlOpenCount: 0,
    deviationOpenCount: 0,
  };
}

// Empty totals — everything 0, including denominators
function emptyComplianceData(): ComplianceData {
  return {
    approvedDocCount: 0,
    totalDocCount: 0,
    closedCapaCount: 0,
    totalCapaCount: 0,
    completedTrainingCount: 0,
    totalTrainingCount: 0,
    completedAuditCount: 0,
    totalAuditCount: 0,
    closedNcrCount: 0,
    totalNcrCount: 0,
    openRiskCount: 0,
    totalRiskCount: 0,
    releasedBatchCount: 0,
    totalBatchCount: 0,
    qualifiedSupplierCount: 0,
    totalSupplierCount: 0,
    inReviewDocCount: 0,
    recordDocCount: 0,
    validationDocCount: 0,
    batchWithProductCodeCount: 0,
    capaWithRootCauseCount: 0,
    changeControlOpenCount: 0,
    deviationOpenCount: 0,
  };
}

// Partial compliance: ~60% on most metrics (5/8 = 62.5%)
function partialComplianceData(): ComplianceData {
  return {
    approvedDocCount: 6,
    totalDocCount: 10,
    closedCapaCount: 3,
    totalCapaCount: 5,
    completedTrainingCount: 5,
    totalTrainingCount: 8,
    completedAuditCount: 2,
    totalAuditCount: 3,
    closedNcrCount: 2,
    totalNcrCount: 4,
    openRiskCount: 3,
    totalRiskCount: 6,
    releasedBatchCount: 4,
    totalBatchCount: 7,
    qualifiedSupplierCount: 2,
    totalSupplierCount: 4,
    inReviewDocCount: 2,
    recordDocCount: 6,
    validationDocCount: 6,
    batchWithProductCodeCount: 4,
    capaWithRootCauseCount: 3,
    changeControlOpenCount: 3,
    deviationOpenCount: 2,
  };
}

// ============================================================================
// 1. Helper functions (tested indirectly through computeStatus)
// ============================================================================

describe('Helper functions (indirect testing via computeStatus)', () => {
  describe('pct — division by zero returns 0', () => {
    it('returns not_assessed when denominator is 0 (empty data)', () => {
      const checklist = getChecklistById('iso13485')!;
      const clause = checklist.clauses.find(c => c.id === 'iso-4.1')!;
      // With all totals at 0, pct(n, 0) should yield 0, so statusFromPct(0) => 'not_assessed'
      expect(clause.computeStatus(emptyComplianceData())).toBe('not_assessed');
    });
  });

  describe('statusFromPct — boundary thresholds', () => {
    const checklist = getChecklistById('iso13485')!;
    const clause = checklist.clauses.find(c => c.id === 'iso-4.1')!;

    it('returns compliant when percentage >= 80', () => {
      // 8/10 = 80%
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 8, totalDocCount: 10 };
      expect(clause.computeStatus(data)).toBe('compliant');
    });

    it('returns compliant when percentage > 80', () => {
      // 9/10 = 90%
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 9, totalDocCount: 10 };
      expect(clause.computeStatus(data)).toBe('compliant');
    });

    it('returns partially when percentage is 50-79', () => {
      // 5/10 = 50%
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 5, totalDocCount: 10 };
      expect(clause.computeStatus(data)).toBe('partially');
    });

    it('returns partially when percentage is 79', () => {
      // ~79/100
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 79, totalDocCount: 100 };
      expect(clause.computeStatus(data)).toBe('partially');
    });

    it('returns non_compliant when percentage is 1-49', () => {
      // 4/10 = 40%
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 4, totalDocCount: 10 };
      expect(clause.computeStatus(data)).toBe('non_compliant');
    });

    it('returns non_compliant when percentage is just above 0', () => {
      // 1/10 = 10%
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 1, totalDocCount: 10 };
      expect(clause.computeStatus(data)).toBe('non_compliant');
    });

    it('returns not_assessed when percentage is 0', () => {
      const data: ComplianceData = { ...fullComplianceData(), approvedDocCount: 0, totalDocCount: 10 };
      expect(clause.computeStatus(data)).toBe('not_assessed');
    });
  });

  describe('statusFromBool — tested via ICH Q10 clause ich-3.3 (Change Management)', () => {
    const checklist = getChecklistById('ichq10')!;
    const clause = checklist.clauses.find(c => c.id === 'ich-3.3')!;

    it('returns compliant when changeControlOpenCount < 5 and hasData is true (via closedCapaCount)', () => {
      // changeControlOpenCount = 2 (< 5), hasData = closedCapaCount > 0 => true
      const data: ComplianceData = { ...fullComplianceData(), changeControlOpenCount: 2, closedCapaCount: 3 };
      expect(clause.computeStatus(data)).toBe('compliant');
    });

    it('returns non_compliant when changeControlOpenCount >= 5 and hasData is true', () => {
      const data: ComplianceData = { ...fullComplianceData(), changeControlOpenCount: 5, closedCapaCount: 3 };
      expect(clause.computeStatus(data)).toBe('non_compliant');
    });

    it('returns non_compliant when changeControlOpenCount >= 5 and hasData via changeControlOpenCount > 0', () => {
      const data: ComplianceData = { ...fullComplianceData(), changeControlOpenCount: 7, closedCapaCount: 0 };
      expect(clause.computeStatus(data)).toBe('non_compliant');
    });

    it('returns not_assessed when hasData is false (no open changes, no closed CAPAs)', () => {
      // changeControlOpenCount = 0, closedCapaCount = 0 => hasData = false
      const data: ComplianceData = { ...fullComplianceData(), changeControlOpenCount: 0, closedCapaCount: 0 };
      expect(clause.computeStatus(data)).toBe('not_assessed');
    });

    it('returns compliant when changeControlOpenCount = 0 and hasData is true (via closedCapaCount > 0)', () => {
      const data: ComplianceData = { ...fullComplianceData(), changeControlOpenCount: 0, closedCapaCount: 1 };
      expect(clause.computeStatus(data)).toBe('compliant');
    });

    it('returns compliant when changeControlOpenCount = 4 (just below threshold) and hasData is true', () => {
      const data: ComplianceData = { ...fullComplianceData(), changeControlOpenCount: 4, closedCapaCount: 1 };
      expect(clause.computeStatus(data)).toBe('compliant');
    });
  });
});

// ============================================================================
// 2. ISO 13485:2016 Checklist — 15 clauses
// ============================================================================

describe('ISO 13485:2016 Checklist', () => {
  const checklist = getChecklistById('iso13485')!;

  it('has correct metadata', () => {
    expect(checklist.id).toBe('iso13485');
    expect(checklist.name).toBe('ISO 13485:2016 Compliance Checklist');
    expect(checklist.standard).toBe('ISO 13485:2016');
  });

  it('has 15 clauses', () => {
    expect(checklist.clauses).toHaveLength(15);
  });

  it('all clause IDs start with "iso-"', () => {
    for (const clause of checklist.clauses) {
      expect(clause.id).toMatch(/^iso-/);
    }
  });

  describe('all data at 100% — all clauses should be compliant', () => {
    const data = fullComplianceData();

    it('4.1 General Requirements', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('4.2 Documentation Requirements', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('4.2.3 Document Control', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.3')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('4.2.4 Record Control', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.4')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('5 Management Responsibility', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-5')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('5.6 Management Review', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-5.6')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('6 Resource Management', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-6')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('7.1 Planning of Product Realization', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('7.5 Production and Service Provision', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('7.5.6 Validation of Processes', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5.6')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('7.5.9 Traceability', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5.9')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('8.2 Monitoring and Measurement', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.2')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('8.3 Non-Conforming Product', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.3')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('8.4 Analysis of Data', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.4')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('8.5 Improvement', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.5')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });
  });

  describe('all data at 0 (non-zero denominators) — should be not_assessed', () => {
    const data = zeroComplianceData();

    it('4.1 General Requirements — 0/10 approved => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('4.2 Documentation Requirements — 0/10 approved => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('4.2.3 Document Control — 0+0/10 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.3')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('4.2.4 Record Control — 0/10 records => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.4')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('5 Management Responsibility — 0/3 audits => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-5')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('5.6 Management Review — 0/3 audits => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-5.6')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('6 Resource Management — 0/8 training => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-6')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('7.1 Planning of Product Realization — (6-6)/6 risks closed => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('7.5 Production and Service Provision — 0/7 batches => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('7.5.6 Validation of Processes — 0/10 validation docs => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5.6')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('7.5.9 Traceability — 0/7 batches with product code => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5.9')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('8.2 Monitoring and Measurement — 0/3 audits => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.2')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('8.3 Non-Conforming Product — 0/4 NCRs closed => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.3')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('8.4 Analysis of Data — 0/5 CAPAs with root cause => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.4')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('8.5 Improvement — 0/5 CAPAs closed => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.5')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });
  });

  describe('partial compliance (~60%) — all clauses should be partially', () => {
    const data = partialComplianceData();

    it('4.1 General Requirements — 6/10 = 60% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.1')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('4.2 Documentation Requirements — 6/10 = 60% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('4.2.3 Document Control — (6+2)/10 = 80% => compliant', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.3')!;
      // This one uses approvedDocCount + inReviewDocCount = 8/10 = 80%
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('4.2.4 Record Control — 6/10 = 60% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.4')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('5 Management Responsibility — 2/3 = 66.7% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-5')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('6 Resource Management — 5/8 = 62.5% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-6')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('7.1 Planning of Product Realization — (6-3)/6 = 50% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.1')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('7.5 Production and Service Provision — 4/7 ≈ 57% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('8.3 Non-Conforming Product — 2/4 = 50% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.3')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('8.5 Improvement — 3/5 = 60% => partially', () => {
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.5')!;
      expect(c.computeStatus(data)).toBe('partially');
    });
  });

  describe('mixed data — specific clause statuses', () => {
    it('4.2.3 Document Control: approved 5 + inReview 3 = 8/10 = 80% => compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        approvedDocCount: 5,
        inReviewDocCount: 3,
        totalDocCount: 10,
      };
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.3')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('4.2.4 Record Control: recordDocCount 4/10 = 40% => non_compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        recordDocCount: 4,
        totalDocCount: 10,
      };
      const c = checklist.clauses.find(cl => cl.id === 'iso-4.2.4')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });

    it('7.1 Planning: totalRisk 10, openRisk 9 => 1 closed / 10 = 10% => non_compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        openRiskCount: 9,
        totalRiskCount: 10,
      };
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.1')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });

    it('7.5.9 Traceability: 3/7 batches with productCode = 42.9% => non_compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        batchWithProductCodeCount: 3,
        totalBatchCount: 7,
      };
      const c = checklist.clauses.find(cl => cl.id === 'iso-7.5.9')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });

    it('8.4 Analysis of Data: 2/5 CAPAs with root cause = 40% => non_compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        capaWithRootCauseCount: 2,
        totalCapaCount: 5,
      };
      const c = checklist.clauses.find(cl => cl.id === 'iso-8.4')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });
  });

  describe('empty data (all totals zero) — all clauses return not_assessed', () => {
    const data = emptyComplianceData();

    it('every clause returns not_assessed when all totals are 0', () => {
      for (const clause of checklist.clauses) {
        expect(clause.computeStatus(data)).toBe('not_assessed');
      }
    });
  });
});

// ============================================================================
// 3. ICH Q10 Checklist — 13 clauses
// ============================================================================

describe('ICH Q10 Checklist', () => {
  const checklist = getChecklistById('ichq10')!;

  it('has correct metadata', () => {
    expect(checklist.id).toBe('ichq10');
    expect(checklist.name).toBe('ICH Q10 Pharmaceutical Quality System Checklist');
    expect(checklist.standard).toBe('ICH Q10');
  });

  it('has 13 clauses', () => {
    expect(checklist.clauses).toHaveLength(13);
  });

  it('all clause IDs start with "ich-"', () => {
    for (const clause of checklist.clauses) {
      expect(clause.id).toMatch(/^ich-/);
    }
  });

  describe('all data at 100% — all clauses should be compliant', () => {
    const data = fullComplianceData();

    it('1 PQS', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('2.1 Senior Management Responsibility', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-2.1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('2.2 Management Review', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-2.2')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('3.1 Process Performance & Product Quality', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('3.2 CAPA', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.2')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('3.2.1 Root Cause Investigation', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.2.1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('3.3 Change Management', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.3')!;
      // changeControlOpenCount = 1 (< 5), hasData = changeControlOpenCount > 0 (true)
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('4 Resource Management', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-4')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('5 Manufacturing Operations & Batch Release', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-5')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('5.1 Supplier Qualification', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-5.1')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('6 Non-Conformance & Deviation Management', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-6')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('7 Document Control & Records', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-7')!;
      // (10 + 0) / 10 = 100%
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('8 Risk Management', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-8')!;
      // (6 - 0) / 6 = 100%
      expect(c.computeStatus(data)).toBe('compliant');
    });
  });

  describe('all data at 0 (non-zero denominators) — should be not_assessed or non_compliant', () => {
    const data = zeroComplianceData();

    it('1 PQS — 0/10 approved => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('2.1 Senior Management Responsibility — 0/3 audits => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-2.1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('2.2 Management Review — 0/3 audits => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-2.2')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('3.1 Process Performance & Product Quality — 0/7 batches => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('3.2 CAPA — 0/5 closed => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.2')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('3.2.1 Root Cause Investigation — 0/5 with root cause => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.2.1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('3.3 Change Management — no data (0 open changes, 0 closed CAPAs) => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.3')!;
      // changeControlOpenCount = 0, closedCapaCount = 0 => hasData = false => not_assessed
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('4 Resource Management — 0/8 training => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-4')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('5 Manufacturing Operations & Batch Release — 0/7 batches => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-5')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('5.1 Supplier Qualification — 0/4 qualified => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-5.1')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('6 Non-Conformance & Deviation Management — 0/4 closed => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-6')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('7 Document Control & Records — 0+0/10 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-7')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('8 Risk Management — (6-6)/6 = 0% => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ich-8')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });
  });

  describe('partial compliance — partially compliant scenarios', () => {
    it('1 PQS — 6/10 = 60% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), approvedDocCount: 6, totalDocCount: 10 };
      const c = checklist.clauses.find(cl => cl.id === 'ich-1')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('3.2 CAPA — 3/5 = 60% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), closedCapaCount: 3, totalCapaCount: 5 };
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.2')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('5.1 Supplier Qualification — 2/4 = 50% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), qualifiedSupplierCount: 2, totalSupplierCount: 4 };
      const c = checklist.clauses.find(cl => cl.id === 'ich-5.1')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('8 Risk Management — 3/6 = 50% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), openRiskCount: 3, totalRiskCount: 6 };
      const c = checklist.clauses.find(cl => cl.id === 'ich-8')!;
      expect(c.computeStatus(data)).toBe('partially');
    });
  });

  describe('3.3 Change Management — statusFromBool edge cases', () => {
    it('non_compliant when changeControlOpenCount >= 5 and hasData is true', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        changeControlOpenCount: 6,
        closedCapaCount: 1,
      };
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.3')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });

    it('compliant when changeControlOpenCount = 0 and closedCapaCount > 0', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        changeControlOpenCount: 0,
        closedCapaCount: 2,
      };
      const c = checklist.clauses.find(cl => cl.id === 'ich-3.3')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });
  });

  describe('empty data (all totals zero) — all clauses return not_assessed', () => {
    const data = emptyComplianceData();

    it('every clause returns not_assessed when all totals are 0', () => {
      for (const clause of checklist.clauses) {
        expect(clause.computeStatus(data)).toBe('not_assessed');
      }
    });
  });
});

// ============================================================================
// 4. IVDR EU 2017/746 Checklist — 12 clauses
// ============================================================================

describe('IVDR EU 2017/746 Checklist', () => {
  const checklist = getChecklistById('ivdr')!;

  it('has correct metadata', () => {
    expect(checklist.id).toBe('ivdr');
    expect(checklist.name).toBe('IVDR EU 2017/746 Compliance Checklist');
    expect(checklist.standard).toBe('IVDR EU 2017/746');
  });

  it('has 12 clauses', () => {
    expect(checklist.clauses).toHaveLength(12);
  });

  it('all clause IDs start with "ivdr-"', () => {
    for (const clause of checklist.clauses) {
      expect(clause.id).toMatch(/^ivdr-/);
    }
  });

  describe('all data at 100% — all clauses should be compliant', () => {
    const data = fullComplianceData();

    it('Art. 4 General Obligations', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-4')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 8 Obligations of Manufacturers', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-8')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 10 Quality Management System', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 10(4) Post-Market Surveillance', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10.4')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 10(9) Corrective Actions & Field Safety', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10.9')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 12 Technical Documentation', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-12')!;
      // (10 + 0) / 10 = 100%
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 13 Risk Management System', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-13')!;
      // (6 - 0) / 6 = 100%
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 15 Person Responsible for Regulatory Compliance', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-15')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 16 Traceability of Devices', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-16')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 56 Performance Evaluation', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-56')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 83 Post-Market Surveillance Plan', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-83')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 87 Reporting of Serious Incidents', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-87')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });
  });

  describe('all data at 0 (non-zero denominators) — should be not_assessed', () => {
    const data = zeroComplianceData();

    it('Art. 4 General Obligations — 0/10 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-4')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 8 Obligations of Manufacturers — 0/10 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-8')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 10 Quality Management System — 0/10 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 10(4) Post-Market Surveillance — 0/4 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10.4')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 10(9) Corrective Actions & Field Safety — 0/5 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10.9')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 12 Technical Documentation — 0+0/10 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-12')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 13 Risk Management System — (6-6)/6 = 0% => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-13')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 15 Person Responsible for Regulatory Compliance — 0/8 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-15')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 16 Traceability of Devices — 0/7 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-16')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 56 Performance Evaluation — 0/3 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-56')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 83 Post-Market Surveillance Plan — 0/4 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-83')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });

    it('Art. 87 Reporting of Serious Incidents — 0/5 => not_assessed', () => {
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-87')!;
      expect(c.computeStatus(data)).toBe('not_assessed');
    });
  });

  describe('partial compliance — partially compliant scenarios', () => {
    it('Art. 4 General Obligations — 5/10 = 50% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), approvedDocCount: 5, totalDocCount: 10 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-4')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('Art. 10(4) Post-Market Surveillance — 2/4 = 50% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), closedNcrCount: 2, totalNcrCount: 4 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10.4')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('Art. 10(9) Corrective Actions — 3/5 = 60% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), closedCapaCount: 3, totalCapaCount: 5 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-10.9')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('Art. 13 Risk Management — 3/6 = 50% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), openRiskCount: 3, totalRiskCount: 6 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-13')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('Art. 15 PRRC — 5/8 = 62.5% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), completedTrainingCount: 5, totalTrainingCount: 8 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-15')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('Art. 16 Traceability — 4/7 ≈ 57% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), batchWithProductCodeCount: 4, totalBatchCount: 7 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-16')!;
      expect(c.computeStatus(data)).toBe('partially');
    });

    it('Art. 56 Performance Evaluation — 2/3 ≈ 67% => partially', () => {
      const data: ComplianceData = { ...emptyComplianceData(), completedAuditCount: 2, totalAuditCount: 3 };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-56')!;
      expect(c.computeStatus(data)).toBe('partially');
    });
  });

  describe('mixed data — specific clause statuses', () => {
    it('Art. 12 Technical Documentation — (5 + 3)/10 = 80% => compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        approvedDocCount: 5,
        inReviewDocCount: 3,
        totalDocCount: 10,
      };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-12')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 13 Risk Management — 9/10 = 90% closed risks => compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        openRiskCount: 1,
        totalRiskCount: 10,
      };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-13')!;
      expect(c.computeStatus(data)).toBe('compliant');
    });

    it('Art. 16 Traceability — 1/10 = 10% => non_compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        batchWithProductCodeCount: 1,
        totalBatchCount: 10,
      };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-16')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });

    it('Art. 87 Reporting — 1/5 = 20% => non_compliant', () => {
      const data: ComplianceData = {
        ...emptyComplianceData(),
        closedCapaCount: 1,
        totalCapaCount: 5,
      };
      const c = checklist.clauses.find(cl => cl.id === 'ivdr-87')!;
      expect(c.computeStatus(data)).toBe('non_compliant');
    });
  });

  describe('empty data (all totals zero) — all clauses return not_assessed', () => {
    const data = emptyComplianceData();

    it('every clause returns not_assessed when all totals are 0', () => {
      for (const clause of checklist.clauses) {
        expect(clause.computeStatus(data)).toBe('not_assessed');
      }
    });
  });
});

// ============================================================================
// 5. Registry functions — getChecklistById
// ============================================================================

describe('getChecklistById', () => {
  it('returns the ISO 13485 checklist for "iso13485"', () => {
    const result = getChecklistById('iso13485');
    expect(result).toBeDefined();
    expect(result!.id).toBe('iso13485');
    expect(result!.standard).toBe('ISO 13485:2016');
  });

  it('returns the ICH Q10 checklist for "ichq10"', () => {
    const result = getChecklistById('ichq10');
    expect(result).toBeDefined();
    expect(result!.id).toBe('ichq10');
    expect(result!.standard).toBe('ICH Q10');
  });

  it('returns the IVDR checklist for "ivdr"', () => {
    const result = getChecklistById('ivdr');
    expect(result).toBeDefined();
    expect(result!.id).toBe('ivdr');
    expect(result!.standard).toBe('IVDR EU 2017/746');
  });

  it('returns undefined for unknown id', () => {
    const result = getChecklistById('unknown');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const result = getChecklistById('');
    expect(result).toBeUndefined();
  });

  it('COMPLIANCE_CHECKLISTS record has exactly 3 entries', () => {
    expect(Object.keys(COMPLIANCE_CHECKLISTS)).toHaveLength(3);
    expect(Object.keys(COMPLIANCE_CHECKLISTS)).toEqual(
      expect.arrayContaining(['iso13485', 'ichq10', 'ivdr'])
    );
  });
});

// ============================================================================
// 6. getChecklistForIndustry
// ============================================================================

describe('getChecklistForIndustry', () => {
  it('returns iso13485 for medical_device', () => {
    const result = getChecklistForIndustry('medical_device');
    expect(result.id).toBe('iso13485');
  });

  it('returns ichq10 for pharmaceutical', () => {
    const result = getChecklistForIndustry('pharmaceutical');
    expect(result.id).toBe('ichq10');
  });

  it('returns ichq10 for biotech', () => {
    const result = getChecklistForIndustry('biotech');
    expect(result.id).toBe('ichq10');
  });

  it('returns ivdr for ivd', () => {
    const result = getChecklistForIndustry('ivd');
    expect(result.id).toBe('ivdr');
  });

  it('returns iso13485 for combination_product', () => {
    const result = getChecklistForIndustry('combination_product');
    expect(result.id).toBe('iso13485');
  });

  it('returns iso13485 (default) for unknown industry', () => {
    const result = getChecklistForIndustry('unknown_industry');
    expect(result.id).toBe('iso13485');
  });

  it('returns iso13485 (default) for empty string', () => {
    const result = getChecklistForIndustry('');
    expect(result.id).toBe('iso13485');
  });

  it('returns a valid ComplianceChecklist object with clauses', () => {
    const result = getChecklistForIndustry('pharmaceutical');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('standard');
    expect(result.clauses.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 7. buildComplianceData
// ============================================================================

describe('buildComplianceData', () => {
  it('returns correct zero counts for empty arrays', () => {
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });

    expect(result.approvedDocCount).toBe(0);
    expect(result.totalDocCount).toBe(0);
    expect(result.closedCapaCount).toBe(0);
    expect(result.totalCapaCount).toBe(0);
    expect(result.completedTrainingCount).toBe(0);
    expect(result.totalTrainingCount).toBe(0);
    expect(result.completedAuditCount).toBe(0);
    expect(result.totalAuditCount).toBe(0);
    expect(result.closedNcrCount).toBe(0);
    expect(result.totalNcrCount).toBe(0);
    expect(result.openRiskCount).toBe(0);
    expect(result.totalRiskCount).toBe(0);
    expect(result.releasedBatchCount).toBe(0);
    expect(result.totalBatchCount).toBe(0);
    expect(result.qualifiedSupplierCount).toBe(0);
    expect(result.totalSupplierCount).toBe(0);
    expect(result.inReviewDocCount).toBe(0);
    expect(result.recordDocCount).toBe(0);
    expect(result.validationDocCount).toBe(0);
    expect(result.batchWithProductCodeCount).toBe(0);
    expect(result.capaWithRootCauseCount).toBe(0);
    expect(result.changeControlOpenCount).toBe(0);
    expect(result.deviationOpenCount).toBe(0);
  });

  it('counts approvedDocCount correctly — only "Approved" status', () => {
    const documents = [
      { status: 'Approved', type: 'SOP' },
      { status: 'Draft', type: 'SOP' },
      { status: 'Approved', type: 'Form' },
      { status: 'In Review', type: 'SOP' },
      { status: 'Rejected', type: 'SOP' },
    ];
    const result = buildComplianceData({
      documents,
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.approvedDocCount).toBe(2);
    expect(result.totalDocCount).toBe(5);
  });

  it('counts inReviewDocCount correctly — only "In Review" status', () => {
    const documents = [
      { status: 'In Review', type: 'SOP' },
      { status: 'Approved', type: 'SOP' },
      { status: 'In Review', type: 'Form' },
    ];
    const result = buildComplianceData({
      documents,
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.inReviewDocCount).toBe(2);
  });

  it('counts recordDocCount correctly — type "Record" or "Form"', () => {
    const documents = [
      { status: 'Approved', type: 'Record' },
      { status: 'Approved', type: 'Form' },
      { status: 'Approved', type: 'SOP' },
      { status: 'Approved', type: 'Validation Protocol' },
    ];
    const result = buildComplianceData({
      documents,
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.recordDocCount).toBe(2); // Record + Form
  });

  it('counts validationDocCount correctly — type "Validation Protocol"', () => {
    const documents = [
      { status: 'Approved', type: 'Validation Protocol' },
      { status: 'Approved', type: 'Validation Protocol' },
      { status: 'Approved', type: 'SOP' },
    ];
    const result = buildComplianceData({
      documents,
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.validationDocCount).toBe(2);
  });

  it('counts closedCapaCount correctly — only "Closed" status', () => {
    const capas = [
      { status: 'Closed', rootCauseAnalysis: 'RCA-1' },
      { status: 'Open', rootCauseAnalysis: undefined },
      { status: 'Closed', rootCauseAnalysis: 'RCA-2' },
      { status: 'In Progress', rootCauseAnalysis: 'RCA-3' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas,
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.closedCapaCount).toBe(2);
    expect(result.totalCapaCount).toBe(4);
  });

  it('counts capaWithRootCauseCount correctly — only truthy rootCauseAnalysis', () => {
    const capas = [
      { status: 'Closed', rootCauseAnalysis: 'RCA-1' },
      { status: 'Open', rootCauseAnalysis: undefined },
      { status: 'Closed' }, // no rootCauseAnalysis field
      { status: 'In Progress', rootCauseAnalysis: 'RCA-3' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas,
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.capaWithRootCauseCount).toBe(2); // 'RCA-1' and 'RCA-3'
  });

  it('counts completedTrainingCount correctly — only "Completed" status', () => {
    const trainingItems = [
      { status: 'Completed' },
      { status: 'In Progress' },
      { status: 'Completed' },
      { status: 'Not Started' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems,
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.completedTrainingCount).toBe(2);
    expect(result.totalTrainingCount).toBe(4);
  });

  it('counts completedAuditCount correctly — only "Completed" status', () => {
    const audits = [
      { status: 'Completed' },
      { status: 'Scheduled' },
      { status: 'Completed' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits,
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.completedAuditCount).toBe(2);
    expect(result.totalAuditCount).toBe(3);
  });

  it('counts closedNcrCount correctly — only "Closed" status', () => {
    const ncrs = [
      { status: 'Closed' },
      { status: 'Open' },
      { status: 'Closed' },
      { status: 'Under Review' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs,
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.closedNcrCount).toBe(2);
    expect(result.totalNcrCount).toBe(4);
  });

  it('counts openRiskCount correctly — only "Open" status', () => {
    const risks = [
      { status: 'Open' },
      { status: 'Closed' },
      { status: 'Open' },
      { status: 'Mitigated' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks,
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.openRiskCount).toBe(2);
    expect(result.totalRiskCount).toBe(4);
  });

  it('counts releasedBatchCount correctly — only "Released" status', () => {
    const batchRecords = [
      { status: 'Released', productCode: 'PC-001' },
      { status: 'In Production', productCode: 'PC-002' },
      { status: 'Released', productCode: undefined },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords,
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.releasedBatchCount).toBe(2);
    expect(result.totalBatchCount).toBe(3);
  });

  it('counts batchWithProductCodeCount correctly — only truthy productCode', () => {
    const batchRecords = [
      { status: 'Released', productCode: 'PC-001' },
      { status: 'Released', productCode: undefined },
      { status: 'Released', productCode: 'PC-003' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords,
      suppliers: [],
      changeControls: [],
      deviations: [],
    });
    expect(result.batchWithProductCodeCount).toBe(2); // PC-001 and PC-003
  });

  it('counts qualifiedSupplierCount correctly — only "Qualified" status', () => {
    const suppliers = [
      { status: 'Qualified' },
      { status: 'Pending' },
      { status: 'Qualified' },
      { status: 'Disqualified' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers,
      changeControls: [],
      deviations: [],
    });
    expect(result.qualifiedSupplierCount).toBe(2);
    expect(result.totalSupplierCount).toBe(4);
  });

  it('counts changeControlOpenCount correctly — not "Completed" and not "Rejected"', () => {
    const changeControls = [
      { status: 'Open' },
      { status: 'In Progress' },
      { status: 'Completed' },
      { status: 'Rejected' },
      { status: 'Under Review' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls,
      deviations: [],
    });
    // Open, In Progress, Under Review are open (not Completed/Rejected)
    expect(result.changeControlOpenCount).toBe(3);
  });

  it('counts deviationOpenCount correctly — not "Closed" and not "Approved"', () => {
    const deviations = [
      { status: 'Open' },
      { status: 'Under Investigation' },
      { status: 'Closed' },
      { status: 'Approved' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations,
    });
    // Open, Under Investigation are not Closed/Approved
    expect(result.deviationOpenCount).toBe(2);
  });

  it('handles a comprehensive mixed scenario correctly', () => {
    const result = buildComplianceData({
      documents: [
        { status: 'Approved', type: 'SOP' },
        { status: 'Approved', type: 'Record' },
        { status: 'In Review', type: 'Form' },
        { status: 'Draft', type: 'Validation Protocol' },
      ],
      capas: [
        { status: 'Closed', rootCauseAnalysis: 'Fishbone' },
        { status: 'Open', rootCauseAnalysis: undefined },
      ],
      trainingItems: [
        { status: 'Completed' },
        { status: 'In Progress' },
      ],
      audits: [
        { status: 'Completed' },
      ],
      ncrs: [
        { status: 'Closed' },
        { status: 'Open' },
        { status: 'Open' },
      ],
      risks: [
        { status: 'Open' },
        { status: 'Closed' },
      ],
      batchRecords: [
        { status: 'Released', productCode: 'A-100' },
        { status: 'In Production', productCode: undefined },
      ],
      suppliers: [
        { status: 'Qualified' },
        { status: 'Qualified' },
        { status: 'Pending' },
      ],
      changeControls: [
        { status: 'Open' },
        { status: 'Completed' },
      ],
      deviations: [
        { status: 'Open' },
        { status: 'Closed' },
      ],
    });

    expect(result.approvedDocCount).toBe(2);
    expect(result.totalDocCount).toBe(4);
    expect(result.inReviewDocCount).toBe(1);
    expect(result.recordDocCount).toBe(2); // Record + Form
    expect(result.validationDocCount).toBe(1);
    expect(result.closedCapaCount).toBe(1);
    expect(result.totalCapaCount).toBe(2);
    expect(result.capaWithRootCauseCount).toBe(1);
    expect(result.completedTrainingCount).toBe(1);
    expect(result.totalTrainingCount).toBe(2);
    expect(result.completedAuditCount).toBe(1);
    expect(result.totalAuditCount).toBe(1);
    expect(result.closedNcrCount).toBe(1);
    expect(result.totalNcrCount).toBe(3);
    expect(result.openRiskCount).toBe(1);
    expect(result.totalRiskCount).toBe(2);
    expect(result.releasedBatchCount).toBe(1);
    expect(result.totalBatchCount).toBe(2);
    expect(result.batchWithProductCodeCount).toBe(1);
    expect(result.qualifiedSupplierCount).toBe(2);
    expect(result.totalSupplierCount).toBe(3);
    expect(result.changeControlOpenCount).toBe(1); // 'Open' only (Completed excluded)
    expect(result.deviationOpenCount).toBe(1); // 'Open' only (Closed excluded)
  });

  it('all changeControls Completed/Rejected yields 0 open', () => {
    const changeControls = [
      { status: 'Completed' },
      { status: 'Rejected' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls,
      deviations: [],
    });
    expect(result.changeControlOpenCount).toBe(0);
  });

  it('all deviations Closed/Approved yields 0 open', () => {
    const deviations = [
      { status: 'Closed' },
      { status: 'Approved' },
    ];
    const result = buildComplianceData({
      documents: [],
      capas: [],
      trainingItems: [],
      audits: [],
      ncrs: [],
      risks: [],
      batchRecords: [],
      suppliers: [],
      changeControls: [],
      deviations,
    });
    expect(result.deviationOpenCount).toBe(0);
  });
});
