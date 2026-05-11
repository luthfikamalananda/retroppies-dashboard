import { apiClient } from './client';

export interface Voucher {
  voucher_code: string;
  voucher_title: string;
  discount: number;
  product_type: string;
  period_start: string;
  period_end: string;
  usage_limit: number;
  usage_count: number;
  status: 'active' | 'inactive';
}

export type VoucherPayload = Omit<Voucher, 'usage_count'>;

export interface VoucherListParams {
  status?: 'active' | 'inactive';
  period_start?: string;
  period_end?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const vouchersApi = {
  list: (params?: VoucherListParams) =>
    apiClient
      .get<PaginatedResponse<Voucher>>('/vouchers', { params })
      .then((r) => r.data),

  create: (payload: VoucherPayload) =>
    apiClient.post<Voucher>('/vouchers', payload).then((r) => r.data),

  update: (code: string, payload: Partial<VoucherPayload>) =>
    apiClient.put<Voucher>(`/vouchers/${code}`, payload).then((r) => r.data),

  delete: (code: string) => apiClient.delete(`/vouchers/${code}`),
};
