import { apiClient, type BaseResponse } from './client';

export interface ResultListVoucher {
  total: number
  vouchers: Voucher[]
}

export interface Voucher {
  id: number
  name: string
  value: number
  limit_qty: number
  limit_rp: number
  temp_limit_qty: number
  temp_limit_rp: number
  code: string
  date_from: string
  date_to: string
  status: string
  tenant_id: number
  CreatedAt: string
  CreatedBy: string
  UpdatedAt: string
  UpdatedBy: string
}

// export type VoucherPayload = Omit<Voucher, 'usage_count'>;

export interface VoucherPayload {
  name: string
  value: number
  limit_rp: number
  code: string
  date_from: string
  date_to: string
  status: string
  tenant_id: number
}

export interface VoucherListParams {
  tenant_id: number;
  keyword: string;
  page: number;
  limit: number;
}



export const vouchersApi = {
  list: (params?: VoucherListParams) =>
    apiClient
      .post<BaseResponse<ResultListVoucher>>('/voucher/get', { ...params })
      .then((r) => r.data),

  create: (payload: VoucherPayload) =>
    apiClient.post<Voucher>('/voucher/create', payload).then((r) => r.data),


  update: (id: number, payload: VoucherPayload) =>
    apiClient.post<Voucher>(`/voucher/update`, { id: id, ...payload }).then((r) => r.data),

  delete: (id: number) =>
    apiClient
      .post(`/voucher/delete`, { id: id })
      .then((r) => r.data),
};
