import { apiClient, type BaseResponse } from './client';

export interface Tenant {
    id: number
    name: string
    address: string
    tenant_code: string
    CreatedAt: string
    CreatedBy: string
    UpdatedAt: string
    UpdatedBy: string
}

export interface ResultTenants {
    tenants: Tenant[]
    total: number
}

export interface TenantListParams {
    tenant_id: number;
    keyword: string;
    page: number;
    limit: number;
}
export interface TenantPayload {
    name: string
    address: string
    tenantCode: string
}

export const tenantsApi = {
    list: (params: TenantListParams) =>
        apiClient.post<BaseResponse<ResultTenants>>('/tenants/get', { ...params }).then((r) => r.data),

    create: (payload: TenantPayload) =>
        apiClient.post<BaseResponse<Tenant>>('/tenants/create', { ...payload }).then((r) => r.data),

    update: (id: number, payload: TenantPayload) =>
        apiClient.post<BaseResponse<Tenant>>(`/tenants/update`, { id: id, ...payload }).then((r) => r.data),

    delete: (id: number) =>
        apiClient.post<BaseResponse<null>>(`/tenants/delete`, { id: id }).then((r) => r.data),
};
