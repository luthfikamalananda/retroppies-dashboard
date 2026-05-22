import { apiClient, type BaseResponse } from './client';

export interface ResultListVoucher {
  total: number
  vouchers: Voucher[]
}

export interface Voucher {
  id: number
  name: string
  value: number
  limitQty: number
  limitRp: number
  tempLimitQty: number
  tempLimitRp: number
  tenantName: string
  code: string
  dateFrom: string
  dateTo: string
  status: string
  tenantId: number
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

// export type VoucherPayload = Omit<Voucher, 'usage_count'>;

export interface VoucherPayload {
  name: string
  value: number
  limitRp: number
  code: string
  dateFrom: string
  dateTo: string
  status: string
  tenantId: number
}

export interface VoucherListParams {
  tenantId: number | null;
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
