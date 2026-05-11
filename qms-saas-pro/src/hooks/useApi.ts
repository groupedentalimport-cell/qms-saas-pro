
import { useState, useCallback, useEffect } from 'react';
import type { ApiListResponse, ApiResponse } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// useApi<T> — fetch data with loading / error states
// ---------------------------------------------------------------------------

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  options?: { enabled?: boolean },
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled !== false;

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (enabled) refetch();
  }, [enabled, refetch]);

  return { data, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// useApiMutation<T> — create / update / delete with loading / error states
// ---------------------------------------------------------------------------

interface UseApiMutationState<T> {
  mutate: (data: unknown) => Promise<T | null>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useApiMutation<T>(
  mutationFn: (data: unknown) => Promise<T>,
): UseApiMutationState<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: unknown): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutationFn(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, reset };
}

// ---------------------------------------------------------------------------
// usePaginatedApi<T> — list with pagination
// ---------------------------------------------------------------------------

interface UsePaginatedApiState<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function usePaginatedApi<T>(
  fetchFn: (page: number, pageSize: number) => Promise<ApiListResponse<T>>,
  initialPageSize = 20,
): UsePaginatedApiState<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn(page, pageSize);
      if ('success' in result && result.success) {
        setData(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        setError((result as { error: string }).error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, pageSize]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, total, page, pageSize, totalPages, isLoading, error, setPage, refetch };
}
