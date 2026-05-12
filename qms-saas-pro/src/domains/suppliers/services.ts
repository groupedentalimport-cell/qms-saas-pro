// domains/suppliers/services.ts — Supplier domain service re-exports
// Re-exports from the existing supplierService module

export {
  createSupplier,
  updateSupplier,
  disqualifySupplier,
  calculatePerformanceScore,
  refreshPerformanceScore,
  refreshAllPerformanceScores,
  getSupplierRating,
} from '@/services/supplierService';
