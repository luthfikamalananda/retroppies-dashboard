import { apiClient, type BaseResponse } from './client';

export interface Role {
    id: number;
    name: string;
    description: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface ResultRoles {
    roles: Role[];
    total: number;
}

export interface RoleListParams {
    keyword: string;
    page: number;
    limit: number;
}

export interface RolePayload {
    name: string;
    description: string;
}

export const rolesApi = {
    list: (params: RoleListParams) =>
        apiClient.post<BaseResponse<ResultRoles>>('/role/get', params).then((r) => r.data),

    create: (payload: RolePayload) =>
        apiClient.post<BaseResponse<Role>>('/role', payload).then((r) => r.data),

    update: (id: number, payload: RolePayload) =>
        apiClient.put<BaseResponse<Role>>(`/role/${id}`, payload).then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete<BaseResponse<null>>(`/role/${id}`).then((r) => r.data),
};
