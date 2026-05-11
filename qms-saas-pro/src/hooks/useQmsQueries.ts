
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi, capasApi, ncrsApi, auditsApi, trainingApi,
  risksApi, batchRecordsApi, suppliersApi, changeControlsApi,
  deviationsApi, formTemplatesApi, formInstancesApi,
  auditTrailApi, profilesApi, organizationsApi,
} from '@/lib/api-client';
import type {
  Document, Capa, NonConformance, Audit, Training, Risk,
  BatchRecord, Supplier, FormTemplate, FormInstance,
  AuditTrail, ChangeControl, Deviation, Profile, Organization,
} from '@/types/qms';
import type { ApiResponse, ApiListResponse } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Helper to build query hooks
// ---------------------------------------------------------------------------

function createListQuery<T>(key: string, api: { list: (params?: Record<string, string>) => Promise<ApiListResponse<T>> }) {
  return (params?: Record<string, string>) =>
    useQuery({
      queryKey: [key, 'list', params],
      queryFn: async () => {
        const result = await api.list(params);
        if (result.success) return result;
        throw new Error(result.error);
      },
    });
}

function createDetailQuery<T>(key: string, api: { getById: (id: string) => Promise<ApiResponse<T>> }) {
  return (id: string) =>
    useQuery({
      queryKey: [key, 'detail', id],
      queryFn: async () => {
        const result = await api.getById(id);
        if (result.success) return result.data;
        throw new Error(result.error);
      },
      enabled: !!id,
    });
}

function createCreateMutation<T>(key: string, api: { create: (data: Partial<T>) => Promise<ApiResponse<T>> }) {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: Partial<T>) => {
        const result = await api.create(data);
        if (result.success) return result.data;
        throw new Error(result.error);
      },
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: [key] }); },
    });
  };
}

function createUpdateMutation<T>(key: string, api: { update: (id: string, data: Partial<T>) => Promise<ApiResponse<T>> }) {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
        const result = await api.update(id, data);
        if (result.success) return result.data;
        throw new Error(result.error);
      },
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: [key] }); },
    });
  };
}

function createDeleteMutation(key: string, api: { delete: (id: string) => Promise<ApiResponse<{ deleted: boolean }>> }) {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const result = await api.delete(id);
        if (result.success) return true;
        throw new Error(result.error);
      },
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: [key] }); },
    });
  };
}

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

export const useDocuments = createListQuery<Document>('documents', documentsApi);
export const useDocument = createDetailQuery<Document>('documents', documentsApi);
export const useCreateDocument = createCreateMutation<Document>('documents', documentsApi);
export const useUpdateDocument = createUpdateMutation<Document>('documents', documentsApi);
export const useDeleteDocument = createDeleteMutation('documents', documentsApi);

// ---------------------------------------------------------------------------
// CAPA hooks
// ---------------------------------------------------------------------------

export const useCapas = createListQuery<Capa>('capas', capasApi);
export const useCapa = createDetailQuery<Capa>('capas', capasApi);
export const useCreateCapa = createCreateMutation<Capa>('capas', capasApi);
export const useUpdateCapa = createUpdateMutation<Capa>('capas', capasApi);
export const useDeleteCapa = createDeleteMutation('capas', capasApi);

// ---------------------------------------------------------------------------
// NCR hooks
// ---------------------------------------------------------------------------

export const useNcrs = createListQuery<NonConformance>('ncrs', ncrsApi);
export const useNcr = createDetailQuery<NonConformance>('ncrs', ncrsApi);
export const useCreateNcr = createCreateMutation<NonConformance>('ncrs', ncrsApi);
export const useUpdateNcr = createUpdateMutation<NonConformance>('ncrs', ncrsApi);
export const useDeleteNcr = createDeleteMutation('ncrs', ncrsApi);

// ---------------------------------------------------------------------------
// Audit hooks
// ---------------------------------------------------------------------------

export const useAudits = createListQuery<Audit>('audits', auditsApi);
export const useAudit = createDetailQuery<Audit>('audits', auditsApi);
export const useCreateAudit = createCreateMutation<Audit>('audits', auditsApi);
export const useUpdateAudit = createUpdateMutation<Audit>('audits', auditsApi);
export const useDeleteAudit = createDeleteMutation('audits', auditsApi);

// ---------------------------------------------------------------------------
// Training hooks
// ---------------------------------------------------------------------------

export const useTrainingList = createListQuery<Training>('training', trainingApi);
export const useTraining = createDetailQuery<Training>('training', trainingApi);
export const useCreateTraining = createCreateMutation<Training>('training', trainingApi);
export const useUpdateTraining = createUpdateMutation<Training>('training', trainingApi);
export const useDeleteTraining = createDeleteMutation('training', trainingApi);

// ---------------------------------------------------------------------------
// Risk hooks
// ---------------------------------------------------------------------------

export const useRisks = createListQuery<Risk>('risks', risksApi);
export const useRisk = createDetailQuery<Risk>('risks', risksApi);
export const useCreateRisk = createCreateMutation<Risk>('risks', risksApi);
export const useUpdateRisk = createUpdateMutation<Risk>('risks', risksApi);
export const useDeleteRisk = createDeleteMutation('risks', risksApi);

// ---------------------------------------------------------------------------
// Batch Record hooks
// ---------------------------------------------------------------------------

export const useBatchRecords = createListQuery<BatchRecord>('batchRecords', batchRecordsApi);
export const useBatchRecord = createDetailQuery<BatchRecord>('batchRecords', batchRecordsApi);
export const useCreateBatchRecord = createCreateMutation<BatchRecord>('batchRecords', batchRecordsApi);
export const useUpdateBatchRecord = createUpdateMutation<BatchRecord>('batchRecords', batchRecordsApi);
export const useDeleteBatchRecord = createDeleteMutation('batchRecords', batchRecordsApi);

// ---------------------------------------------------------------------------
// Supplier hooks
// ---------------------------------------------------------------------------

export const useSuppliers = createListQuery<Supplier>('suppliers', suppliersApi);
export const useSupplier = createDetailQuery<Supplier>('suppliers', suppliersApi);
export const useCreateSupplier = createCreateMutation<Supplier>('suppliers', suppliersApi);
export const useUpdateSupplier = createUpdateMutation<Supplier>('suppliers', suppliersApi);
export const useDeleteSupplier = createDeleteMutation('suppliers', suppliersApi);

// ---------------------------------------------------------------------------
// Change Control hooks
// ---------------------------------------------------------------------------

export const useChangeControls = createListQuery<ChangeControl>('changeControls', changeControlsApi);
export const useChangeControl = createDetailQuery<ChangeControl>('changeControls', changeControlsApi);
export const useCreateChangeControl = createCreateMutation<ChangeControl>('changeControls', changeControlsApi);
export const useUpdateChangeControl = createUpdateMutation<ChangeControl>('changeControls', changeControlsApi);
export const useDeleteChangeControl = createDeleteMutation('changeControls', changeControlsApi);

// ---------------------------------------------------------------------------
// Deviation hooks
// ---------------------------------------------------------------------------

export const useDeviations = createListQuery<Deviation>('deviations', deviationsApi);
export const useDeviation = createDetailQuery<Deviation>('deviations', deviationsApi);
export const useCreateDeviation = createCreateMutation<Deviation>('deviations', deviationsApi);
export const useUpdateDeviation = createUpdateMutation<Deviation>('deviations', deviationsApi);
export const useDeleteDeviation = createDeleteMutation('deviations', deviationsApi);

// ---------------------------------------------------------------------------
// Form Template hooks
// ---------------------------------------------------------------------------

export const useFormTemplates = createListQuery<FormTemplate>('formTemplates', formTemplatesApi);
export const useFormTemplate = createDetailQuery<FormTemplate>('formTemplates', formTemplatesApi);
export const useCreateFormTemplate = createCreateMutation<FormTemplate>('formTemplates', formTemplatesApi);

// ---------------------------------------------------------------------------
// Form Instance hooks
// ---------------------------------------------------------------------------

export const useFormInstances = createListQuery<FormInstance>('formInstances', formInstancesApi);
export const useFormInstance = createDetailQuery<FormInstance>('formInstances', formInstancesApi);
export const useCreateFormInstance = createCreateMutation<FormInstance>('formInstances', formInstancesApi);
export const useUpdateFormInstance = createUpdateMutation<FormInstance>('formInstances', formInstancesApi);

// ---------------------------------------------------------------------------
// Audit Trail hooks
// ---------------------------------------------------------------------------

export const useAuditTrail = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ['auditTrail', params],
    queryFn: async () => {
      const result = await auditTrailApi.list(params);
      if (result.success) return result;
      throw new Error(result.error);
    },
  });

// ---------------------------------------------------------------------------
// Profile hooks
// ---------------------------------------------------------------------------

export const useProfiles = () =>
  useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const result = await profilesApi.list();
      if (result.success) return result.data;
      throw new Error(result.error);
    },
  });

// ---------------------------------------------------------------------------
// Organization hooks
// ---------------------------------------------------------------------------

export const useOrganizations = () =>
  useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const result = await organizationsApi.list();
      if (result.success) return result.data;
      throw new Error(result.error);
    },
  });
