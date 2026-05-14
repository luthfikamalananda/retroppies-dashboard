import { apiClient, type BaseResponse } from './client';

export interface ResultUsers {
    users: User[];
    total: number;
}

export interface User {
    id: number
    username: string
    tenant_id: number
    role_id: number
    is_superadmin: boolean
    created_at: string
    role_name: string
    tenant_name: string
}

export interface UserListParams {
    keyword: string;
    page: number;
    limit: number;
}

export interface UserPayload {
    username: string;
    email: string;
    password?: string;
    role: string;
    tenant_id: number;
}

export const usersApi = {
    list: (params: UserListParams) =>
        apiClient.post<BaseResponse<ResultUsers>>('/users/list', params).then((r) => r.data),

    create: (payload: UserPayload) =>
        apiClient.post<BaseResponse<User>>('/users', payload).then((r) => r.data),

    update: (id: number, payload: Omit<UserPayload, 'password'>) =>
        apiClient.put<BaseResponse<User>>(`/users/${id}`, payload).then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete<BaseResponse<null>>(`/users/${id}`).then((r) => r.data),
};
