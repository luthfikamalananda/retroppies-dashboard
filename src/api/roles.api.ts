import { apiClient, type BaseResponse } from './client';

export interface Role {
    ID: number;
    Name: string;
    CreatedAt: string;
}

export interface RoleListParams {
    keyword: string;
    page: number;
    limit: number;
}

export interface RolePayload {
    name: string;
}

export const rolesApi = {
    list: () =>
        apiClient.get<BaseResponse<Role[]>>('/roles/get').then((r) => r.data),
    create: (payload: RolePayload) =>
        apiClient.post<BaseResponse<Role>>('/roles/create', payload).then((r) => r.data),
    delete: (id: number) =>
        apiClient.post<BaseResponse<any>>(`/roles/delete`, { id: id }).then((r) => r.data),
};
