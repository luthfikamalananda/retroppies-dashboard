import { apiClient, type BaseResponse } from './client';

export interface Transaction {
  transaction_id: string;
  date_time: string;
  status: 'success' | 'failed';
  amount: number;
  product: string;
  payment_method?: string;
  outlet?: string;
}

export interface TransactionResult {
  trxList: Transaction[];
  total: number;
}

export interface TransactionListParams {
  dateFrom: string;
  dateTo: string;
  productCode: string;
  tenantId: number | null;
  page: number;
  limit: number;
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
      .post<BaseResponse<TransactionResult>>('/transactions/get-list', { ...params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
};
