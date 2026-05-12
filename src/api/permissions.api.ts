import { apiClient, type BaseResponse } from './client';

export interface Permission {
    id: number;
    name: string;
    description: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface ResultPermissions {
    permissions: Permission[];
    total: number;
}

export interface PermissionListParams {
    keyword: string;
    page: number;
    limit: number;
}

export interface PermissionPayload {
    name: string;
    description: string;
}

export const permissionsApi = {
    list: (params: PermissionListParams) =>
        apiClient.post<BaseResponse<ResultPermissions>>('/permission/get', params).then((r) => r.data),

    create: (payload: PermissionPayload) =>
        apiClient.post<BaseResponse<Permission>>('/permission', payload).then((r) => r.data),

    update: (id: number, payload: PermissionPayload) =>
        apiClient.put<BaseResponse<Permission>>(`/permission/${id}`, payload).then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete<BaseResponse<null>>(`/permission/${id}`).then((r) => r.data),
};
