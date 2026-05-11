import { apiClient } from './client';

export interface Account {
  user_id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  outlet_id?: string;
  status: 'active' | 'inactive';
}

export interface AccountListParams {
  search?: string;
  role?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const accountsApi = {
  list: (params?: AccountListParams) =>
    apiClient
      .get<PaginatedResponse<Account>>('/accounts', { params })
      .then((r) => r.data),

  updateRole: (userId: string, role: string) =>
    apiClient.patch(`/accounts/${userId}/role`, { role }),
};
