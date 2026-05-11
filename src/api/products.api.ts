import { apiClient } from './client';

export interface Product {
  product_code: string;
  product_name: string;
  price: number;
}

export interface ProductListParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const productsApi = {
  list: (params?: ProductListParams) =>
    apiClient
      .get<PaginatedResponse<Product>>('/products', { params })
      .then((r) => r.data),

  create: (payload: Omit<Product, never>) =>
    apiClient.post<Product>('/products', payload).then((r) => r.data),

  update: (code: string, payload: Partial<Product>) =>
    apiClient.put<Product>(`/products/${code}`, payload).then((r) => r.data),

  delete: (code: string) => apiClient.delete(`/products/${code}`),
};
