import { apiClient, type BaseResponse } from './client';

export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    tenant_id: number;
    tenant_name: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface ResultUsers {
    users: User[];
    total: number;
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
        apiClient.post<BaseResponse<ResultUsers>>('/user/get', params).then((r) => r.data),

    create: (payload: UserPayload) =>
        apiClient.post<BaseResponse<User>>('/user', payload).then((r) => r.data),

    update: (id: number, payload: Omit<UserPayload, 'password'>) =>
        apiClient.put<BaseResponse<User>>(`/user/${id}`, payload).then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete<BaseResponse<null>>(`/user/${id}`).then((r) => r.data),
};
