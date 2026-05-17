// domains/risk/services.ts — Risk domain service re-exports
// Re-exports from the existing riskService module

export {
  createRisk,
  updateRisk,
  calculateRiskLevel,
  getRiskLevelColor,
} from '@/qms/services/riskService';
