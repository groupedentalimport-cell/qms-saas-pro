// domains/change-control/services.ts — Change Control domain service re-exports
// Re-exports from the existing changeControlService module

export {
  createChangeControl,
  updateChangeControl,
  approveChangeControl,
  rejectChangeControl,
} from '@/qms/services/changeControlService';
