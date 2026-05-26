import { apiClient, type BaseResponse } from './client';

export interface Transaction {
  id: number
  invoiceNumber: string
  grandTotal: number
  transactionDate: string
  tenantId: number
  tenantName: string
  status: string
  items: ItemTransaction[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface ItemTransaction {
  id: number
  productCode: string
  productName: string
  price: number
  qty: number
  subtotal: number
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
