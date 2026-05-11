import { apiClient } from './client';

export interface Transaction {
  transaction_id: string;
  date_time: string;
  status: 'success' | 'failed';
  amount: number;
  product: string;
  payment_method?: string;
  outlet?: string;
}

export interface TransactionListParams {
  date_start?: string;
  date_end?: string;
  status?: 'success' | 'failed';
  product?: string;
  outlet?: string;
  page?: number;
  page_size?: number;
  sort?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const transactionsApi = {
  list: (params?: TransactionListParams) =>
    apiClient
      .get<PaginatedResponse<Transaction>>('/transactions', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
};
