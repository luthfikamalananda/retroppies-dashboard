import { apiClient, type BaseResponse } from './client';

export interface Product {
  id: number
  productCode: string
  productName: string
  productPrice: number
  productPhoto: string
  tenantId: number
  tenantName: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface ResultProduct {
  total: number
  products: Product[]
}

export interface ProductPayload {
  productCode: string
  productName: string
  productPrice: number
  tenantId: number
}

export interface ProductListParams {
  tenantId: number;
  keyword: string;
  page: number;
  limit: number;
}

export const productsApi = {
  list: (params?: ProductListParams) =>
    apiClient
      .post<BaseResponse<ResultProduct>>('/products/get', { ...params })
      .then((r) => r.data),

  create: (payload: ProductPayload, file?: File | null, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('productCode', payload.productCode);
    form.append('productName', payload.productName);
    form.append('productPrice', String(payload.productPrice));
    form.append('tenantId', String(payload.tenantId));
    if (file) form.append('productPhoto', file);
    return apiClient
      .post<BaseResponse<Product>>('/products/create', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => { if (e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
          : undefined,
      })
      .then((r) => r.data);
  },

  update: (code: number, payload: Partial<ProductPayload>, file?: File | null, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('id', String(code));
    if (payload.productCode !== undefined) form.append('productCode', payload.productCode);
    if (payload.productName !== undefined) form.append('productName', payload.productName);
    if (payload.productPrice !== undefined) form.append('productPrice', String(payload.productPrice));
    if (payload.tenantId !== undefined) form.append('tenantId', String(payload.tenantId));
    if (file) form.append('productPhoto', file);
    return apiClient
      .post<BaseResponse<Product>>(`/products/update`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => { if (e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
          : undefined,
      })
      .then((r) => r.data);
  },

  delete: (code: number) => apiClient.post(`/products/delete`, { id: code }).then((r) => r.data),
};
